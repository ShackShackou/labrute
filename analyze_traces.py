import pandas as pd
import numpy as np
import glob

# Analyser les traces Pixi
pixi_files = glob.glob("E:/Downloads/trace (*.csv")
official_files = glob.glob("E:/Downloads/trace_official*.csv")

def analyze_trace(filepath):
    try:
        df = pd.read_csv(filepath)
        
        # Analyser les positions et mouvements
        stats = {
            'file': filepath.split('\\')[-1],
            'total_frames': len(df),
            'duration': df['t'].max() if 't' in df else 0,
            
            # Positions moyennes
            'L_avg_x': df[df['who'] == 'L']['rootX'].mean() if 'who' in df else 0,
            'L_avg_y': df[df['who'] == 'L']['rootY'].mean() if 'who' in df else 0,
            'R_avg_x': df[df['who'] == 'R']['rootX'].mean() if 'who' in df else 0,
            'R_avg_y': df[df['who'] == 'R']['rootY'].mean() if 'who' in df else 0,
            
            # Variations de position (déplacements)
            'L_x_std': df[df['who'] == 'L']['rootX'].std() if 'who' in df else 0,
            'L_y_std': df[df['who'] == 'L']['rootY'].std() if 'who' in df else 0,
            'R_x_std': df[df['who'] == 'R']['rootX'].std() if 'who' in df else 0,
            'R_y_std': df[df['who'] == 'R']['rootY'].std() if 'who' in df else 0,
            
            # Animations utilisées
            'animations': df['anim'].unique().tolist() if 'anim' in df else []
        }
        
        # Calculer les vitesses de déplacement
        if 'who' in df and 'rootX' in df:
            l_data = df[df['who'] == 'L'].copy()
            r_data = df[df['who'] == 'R'].copy()
            
            if len(l_data) > 1:
                l_data['dx'] = l_data['rootX'].diff()
                l_data['dy'] = l_data['rootY'].diff()
                l_data['dt'] = l_data['t'].diff()
                l_data['speed'] = np.sqrt(l_data['dx']**2 + l_data['dy']**2) / l_data['dt']
                stats['L_avg_speed'] = l_data['speed'].mean()
                stats['L_max_speed'] = l_data['speed'].max()
            
            if len(r_data) > 1:
                r_data['dx'] = r_data['rootX'].diff()
                r_data['dy'] = r_data['rootY'].diff()
                r_data['dt'] = r_data['t'].diff()
                r_data['speed'] = np.sqrt(r_data['dx']**2 + r_data['dy']**2) / r_data['dt']
                stats['R_avg_speed'] = r_data['speed'].mean()
                stats['R_max_speed'] = r_data['speed'].max()
        
        return stats
    except Exception as e:
        print(f"Erreur avec {filepath}: {e}")
        return None

# Analyser le dernier fichier Pixi
latest_pixi = "E:/Downloads/trace (38).csv"
latest_official = "E:/Downloads/trace_official (17).csv"

print("=== ANALYSE TRACE PIXI ===")
pixi_stats = analyze_trace(latest_pixi)
if pixi_stats:
    for key, value in pixi_stats.items():
        if key != 'animations':
            print(f"{key}: {value:.2f}" if isinstance(value, float) else f"{key}: {value}")
    print(f"Animations: {', '.join(pixi_stats['animations'][:10])}")

print("\n=== ANALYSE TRACE OFFICIELLE ===")
official_stats = analyze_trace(latest_official)
if official_stats:
    for key, value in official_stats.items():
        if key != 'animations':
            print(f"{key}: {value:.2f}" if isinstance(value, float) else f"{key}: {value}")
    print(f"Animations: {', '.join(official_stats['animations'][:10])}")

# Comparaison
if pixi_stats and official_stats:
    print("\n=== COMPARAISON ===")
    print(f"Différence position X gauche: {pixi_stats['L_avg_x'] - official_stats['L_avg_x']:.2f}")
    print(f"Différence position X droite: {pixi_stats['R_avg_x'] - official_stats['R_avg_x']:.2f}")
    print(f"Ratio déplacement Y gauche: {pixi_stats['L_y_std'] / official_stats['L_y_std']:.2f}" if official_stats['L_y_std'] > 0 else "N/A")
    print(f"Ratio déplacement Y droite: {pixi_stats['R_y_std'] / official_stats['R_y_std']:.2f}" if official_stats['R_y_std'] > 0 else "N/A")