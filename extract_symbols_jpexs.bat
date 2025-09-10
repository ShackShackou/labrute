@echo off
echo Extraction des Symbol IDs avec JPEXS...

set JPEXS_PATH="C:\Program Files\JPEXS Free Flash Decompiler\ffdec.jar"
if not exist %JPEXS_PATH% set JPEXS_PATH="C:\Program Files (x86)\JPEXS Free Flash Decompiler\ffdec.jar"

echo Extraction en cours...
java -jar %JPEXS_PATH% -export script "labrute-symbol-mapper\jpexs_output" mini_perso.swf
java -jar %JPEXS_PATH% -export sprite "labrute-symbol-mapper\jpexs_sprites" mini_perso.swf
java -jar %JPEXS_PATH% -export shape "labrute-symbol-mapper\jpexs_shapes" mini_perso.swf
java -jar %JPEXS_PATH% -dumpSWF mini_perso.swf > labrute-symbol-mapper\swf_dump.txt

echo Extraction terminee!
pause