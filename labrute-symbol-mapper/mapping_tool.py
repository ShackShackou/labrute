import json
from pathlib import Path
import tkinter as tk
from tkinter import ttk, messagebox
from PIL import Image, ImageTk
import os

class MappingValidator:
    def __init__(self, mapping_file: str = "labrute_mapping.json"):
        self.mapping_file = mapping_file
        self.sprites_folder = "sprites_extraits"
        
        # Vérifier si le fichier existe
        if not Path(mapping_file).exists():
            print(f"❌ Fichier {mapping_file} introuvable !")
            print("Lancez d'abord analyze_with_gpt4.py")
            return
            
        self.load_mapping()
        self.current_index = 0
        
        # Interface
        self.root = tk.Tk()
        self.root.title("LaBrute Symbol Mapping Validator")
        self.root.geometry("600x700")
        self.setup_ui()
        
    def load_mapping(self):
        try:
            with open(self.mapping_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                self.symbols = data['symbols']
                self.symbol_ids = list(self.symbols.keys())
                print(f"✅ {len(self.symbol_ids)} symbols chargés")
        except Exception as e:
            print(f"❌ Erreur chargement : {e}")
            self.symbols = {}
            self.symbol_ids = []
    
    def setup_ui(self):
        # Frame principale
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Image
        self.image_label = tk.Label(main_frame, bg="white", relief=tk.SUNKEN)
        self.image_label.grid(row=0, column=0, columnspan=3, pady=10)
        
        # Infos du symbol
        self.info_text = tk.StringVar()
        info_label = tk.Label(main_frame, textvariable=self.info_text, 
                             font=("Arial", 12), justify=tk.LEFT)
        info_label.grid(row=1, column=0, columnspan=3, pady=10)
        
        # Frame pour les contrôles
        control_frame = ttk.LabelFrame(main_frame, text="Classification", padding="10")
        control_frame.grid(row=2, column=0, columnspan=3, pady=10, sticky=(tk.W, tk.E))
        
        # Type selector
        ttk.Label(control_frame, text="Type:").grid(row=0, column=0, sticky=tk.W, padx=5)
        self.type_var = tk.StringVar()
        types = ['head', 'body', 'arm_left', 'arm_right', 'leg_left', 'leg_right', 
                'weapon', 'shield', 'accessory', 'effect', 'full_character', 'hair',
                'clothing', 'face_part', 'background', 'ui_element', 'unknown']
        self.type_combo = ttk.Combobox(control_frame, textvariable=self.type_var, 
                                      values=types, width=30, state="readonly")
        self.type_combo.grid(row=0, column=1, padx=5)
        
        # Subtype entry
        ttk.Label(control_frame, text="Sous-type:").grid(row=1, column=0, sticky=tk.W, padx=5, pady=5)
        self.subtype_var = tk.StringVar()
        self.subtype_entry = ttk.Entry(control_frame, textvariable=self.subtype_var, width=32)
        self.subtype_entry.grid(row=1, column=1, padx=5, pady=5)
        
        # Notes
        ttk.Label(control_frame, text="Notes:").grid(row=2, column=0, sticky=tk.W, padx=5, pady=5)
        self.notes_text = tk.Text(control_frame, width=40, height=3)
        self.notes_text.grid(row=2, column=1, padx=5, pady=5)
        
        # Confidence
        self.confidence_var = tk.StringVar()
        confidence_label = tk.Label(control_frame, textvariable=self.confidence_var,
                                   font=("Arial", 10, "bold"))
        confidence_label.grid(row=3, column=0, columnspan=2, pady=5)
        
        # Boutons de navigation
        nav_frame = ttk.Frame(main_frame)
        nav_frame.grid(row=3, column=0, columnspan=3, pady=20)
        
        ttk.Button(nav_frame, text="⬅ Précédent", command=self.prev_symbol).pack(side=tk.LEFT, padx=5)
        ttk.Button(nav_frame, text="✓ Valider", command=self.validate_current,
                  style="Accent.TButton").pack(side=tk.LEFT, padx=5)
        ttk.Button(nav_frame, text="Suivant ➡", command=self.next_symbol).pack(side=tk.LEFT, padx=5)
        
        # Boutons d'action
        action_frame = ttk.Frame(main_frame)
        action_frame.grid(row=4, column=0, columnspan=3, pady=10)
        
        ttk.Button(action_frame, text="💾 Sauvegarder", command=self.save_mapping).pack(side=tk.LEFT, padx=5)
        ttk.Button(action_frame, text="📊 Rapport", command=self.show_report).pack(side=tk.LEFT, padx=5)
        ttk.Button(action_frame, text="🔍 Aller à...", command=self.goto_symbol).pack(side=tk.LEFT, padx=5)
        
        # Progress bar
        self.progress_var = tk.DoubleVar()
        self.progress_bar = ttk.Progressbar(main_frame, variable=self.progress_var,
                                           maximum=100, length=400)
        self.progress_bar.grid(row=5, column=0, columnspan=3, pady=10)
        
        # Status
        self.status_var = tk.StringVar()
        status_label = tk.Label(main_frame, textvariable=self.status_var,
                               font=("Arial", 9), fg="gray")
        status_label.grid(row=6, column=0, columnspan=3)
        
        # Charger le premier symbol
        if self.symbol_ids:
            self.show_current()
        else:
            messagebox.showerror("Erreur", "Aucun symbol à afficher !")
    
    def find_image_path(self, filename):
        """Trouve le chemin de l'image dans les sous-dossiers"""
        base_path = Path(self.sprites_folder)
        
        # Chercher dans tous les sous-dossiers
        for img_path in base_path.rglob(filename):
            return img_path
            
        # Essayer aussi avec différentes extensions
        name_without_ext = Path(filename).stem
        for ext in ['.png', '.jpg', '.jpeg']:
            for img_path in base_path.rglob(f"{name_without_ext}{ext}"):
                return img_path
                
        return None
    
    def show_current(self):
        if not self.symbol_ids:
            return
            
        symbol_id = self.symbol_ids[self.current_index]
        symbol_data = self.symbols[symbol_id]
        
        # Afficher l'image
        img_path = self.find_image_path(symbol_data['filename'])
        
        if img_path and img_path.exists():
            try:
                img = Image.open(img_path)
                # Redimensionner si trop grand
                img.thumbnail((300, 300), Image.Resampling.LANCZOS)
                
                # Créer un canvas blanc pour centrer l'image
                canvas = Image.new('RGBA', (300, 300), (255, 255, 255, 255))
                # Calculer la position pour centrer
                x = (300 - img.width) // 2
                y = (300 - img.height) // 2
                canvas.paste(img, (x, y), img if img.mode == 'RGBA' else None)
                
                photo = ImageTk.PhotoImage(canvas)
                self.image_label.config(image=photo)
                self.image_label.image = photo
            except Exception as e:
                self.image_label.config(text=f"Erreur image: {e}", image="")
        else:
            self.image_label.config(text="Image non trouvée", image="")
        
        # Infos
        info = f"Symbol ID: {symbol_id}\n"
        info += f"Fichier: {symbol_data.get('filename', 'inconnu')}\n"
        info += f"Dimensions: {symbol_data.get('dimensions', {}).get('width', '?')}x{symbol_data.get('dimensions', {}).get('height', '?')}\n"
        info += f"Type GPT-4: {symbol_data.get('type', 'unknown')}\n"
        info += f"Description: {symbol_data.get('details', 'Aucune')[:100]}..."
        self.info_text.set(info)
        
        # Remplir les champs
        self.type_var.set(symbol_data.get('type', 'unknown'))
        self.subtype_var.set(symbol_data.get('subtype', ''))
        
        # Notes
        self.notes_text.delete('1.0', tk.END)
        notes = symbol_data.get('notes', '')
        if notes:
            self.notes_text.insert('1.0', notes)
        
        # Confiance
        confidence = symbol_data.get('confidence', 0)
        conf_text = f"Confiance GPT-4: {confidence*100:.0f}%"
        if symbol_data.get('verified'):
            conf_text += " ✓ VÉRIFIÉ"
        self.confidence_var.set(conf_text)
        
        # Progress
        progress = ((self.current_index + 1) / len(self.symbol_ids)) * 100
        self.progress_var.set(progress)
        
        # Status
        verified_count = sum(1 for s in self.symbols.values() if s.get('verified'))
        self.status_var.set(f"[{self.current_index + 1}/{len(self.symbol_ids)}] - "
                           f"{verified_count} vérifiés - {progress:.1f}% complété")
    
    def validate_current(self):
        if not self.symbol_ids:
            return
            
        symbol_id = self.symbol_ids[self.current_index]
        
        # Mettre à jour les données
        self.symbols[symbol_id]['type'] = self.type_var.get()
        self.symbols[symbol_id]['subtype'] = self.subtype_var.get()
        self.symbols[symbol_id]['notes'] = self.notes_text.get('1.0', tk.END).strip()
        self.symbols[symbol_id]['verified'] = True
        self.symbols[symbol_id]['verified_at'] = time.strftime("%Y-%m-%d %H:%M:%S")
        
        # Feedback visuel
        self.root.bell()
        
        # Passer au suivant
        self.next_symbol()
    
    def next_symbol(self):
        if self.current_index < len(self.symbol_ids) - 1:
            self.current_index += 1
            self.show_current()
        else:
            messagebox.showinfo("Fin", "Vous avez atteint le dernier symbol !")
    
    def prev_symbol(self):
        if self.current_index > 0:
            self.current_index -= 1
            self.show_current()
    
    def goto_symbol(self):
        # Dialogue pour aller à un symbol spécifique
        dialog = tk.Toplevel(self.root)
        dialog.title("Aller à...")
        dialog.geometry("300x150")
        
        ttk.Label(dialog, text="Symbol ID ou Index:").pack(pady=10)
        
        entry_var = tk.StringVar()
        entry = ttk.Entry(dialog, textvariable=entry_var, width=20)
        entry.pack(pady=5)
        entry.focus()
        
        def go():
            value = entry_var.get()
            if value.isdigit():
                # C'est un index
                idx = int(value) - 1
                if 0 <= idx < len(self.symbol_ids):
                    self.current_index = idx
                    self.show_current()
                    dialog.destroy()
                else:
                    messagebox.showerror("Erreur", f"Index invalide (1-{len(self.symbol_ids)})")
            elif value in self.symbol_ids:
                # C'est un ID
                self.current_index = self.symbol_ids.index(value)
                self.show_current()
                dialog.destroy()
            else:
                messagebox.showerror("Erreur", "Symbol ID introuvable")
        
        ttk.Button(dialog, text="Aller", command=go).pack(pady=10)
        
        # Bind Enter
        entry.bind('<Return>', lambda e: go())
    
    def show_report(self):
        # Générer un rapport
        report_window = tk.Toplevel(self.root)
        report_window.title("Rapport de Mapping")
        report_window.geometry("500x600")
        
        # Text widget avec scrollbar
        text_frame = ttk.Frame(report_window)
        text_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        scrollbar = ttk.Scrollbar(text_frame)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        report_text = tk.Text(text_frame, wrap=tk.WORD, yscrollcommand=scrollbar.set)
        report_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.config(command=report_text.yview)
        
        # Générer le rapport
        report = "📊 RAPPORT DE MAPPING LABRUTE\n"
        report += "=" * 50 + "\n\n"
        
        # Stats générales
        total = len(self.symbols)
        verified = sum(1 for s in self.symbols.values() if s.get('verified'))
        report += f"Total symbols: {total}\n"
        report += f"Vérifiés: {verified} ({verified/total*100:.1f}%)\n\n"
        
        # Par type
        type_counts = {}
        for symbol_data in self.symbols.values():
            stype = symbol_data.get('type', 'unknown')
            type_counts[stype] = type_counts.get(stype, 0) + 1
        
        report += "RÉPARTITION PAR TYPE:\n"
        for stype, count in sorted(type_counts.items(), key=lambda x: x[1], reverse=True):
            report += f"  {stype}: {count} ({count/total*100:.1f}%)\n"
        
        # Symbols non classés
        report += "\n\nSYMBOLS NON VÉRIFIÉS:\n"
        unverified = [sid for sid, data in self.symbols.items() if not data.get('verified')]
        if unverified:
            for sid in unverified[:20]:  # Limiter à 20
                report += f"  - {sid}: {self.symbols[sid].get('filename', 'unknown')}\n"
            if len(unverified) > 20:
                report += f"  ... et {len(unverified) - 20} autres\n"
        else:
            report += "  Aucun - Tout est vérifié ! 🎉\n"
        
        # Afficher
        report_text.insert('1.0', report)
        report_text.config(state=tk.DISABLED)
        
        # Bouton export
        def export_report():
            with open("mapping_report.txt", "w", encoding="utf-8") as f:
                f.write(report)
            messagebox.showinfo("Export", "Rapport exporté dans mapping_report.txt")
        
        ttk.Button(report_window, text="Exporter", command=export_report).pack(pady=5)
    
    def save_mapping(self):
        try:
            # Charger la structure complète
            with open(self.mapping_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Mettre à jour les symbols
            data['symbols'] = self.symbols
            data['last_modified'] = time.strftime("%Y-%m-%d %H:%M:%S")
            
            # Sauvegarder
            with open(self.mapping_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            messagebox.showinfo("Sauvegarde", f"✅ Mapping sauvegardé dans {self.mapping_file}")
        except Exception as e:
            messagebox.showerror("Erreur", f"Erreur sauvegarde : {e}")
    
    def run(self):
        # Style
        style = ttk.Style()
        style.configure("Accent.TButton", foreground="green")
        
        # Centrer la fenêtre
        self.root.update_idletasks()
        width = self.root.winfo_width()
        height = self.root.winfo_height()
        x = (self.root.winfo_screenwidth() // 2) - (width // 2)
        y = (self.root.winfo_screenheight() // 2) - (height // 2)
        self.root.geometry(f'{width}x{height}+{x}+{y}')
        
        # Lancer
        self.root.mainloop()

if __name__ == "__main__":
    import time
    
    print("🎮 LaBrute Mapping Validator")
    print("=" * 50)
    
    # Vérifier si le mapping existe
    if not Path("labrute_mapping.json").exists():
        print("❌ Fichier labrute_mapping.json introuvable !")
        print("\nLancez d'abord :")
        print("1. python extract_symbols.py")
        print("2. python analyze_with_gpt4.py")
    else:
        validator = MappingValidator()
        validator.run()