"""Package only the current source, note and relevant documentation."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
files = [root / p for p in ['README.md', 'package.json', 'package-lock.json', 'index.html', 'vite.config.js', '.gitignore']]
for folder in ['src', 'tests', 'docs/assets/v2']:
    files.extend(p for p in (root / folder).rglob('*') if p.is_file())
files.extend(p for p in (root / 'docs').iterdir() if p.suffix in {'.py', '.ps1', '.md'})
files.append(root / 'output/STEM_Klebanskyi_Frontend_Reports.docx')
archive = root / 'output/STEM_Klebanskyi_React_Project.zip'
with ZipFile(archive, 'w', ZIP_DEFLATED) as z:
    for path in sorted(set(files)):
        z.write(path, path.relative_to(root))
with ZipFile(archive) as z:
    assert z.testzip() is None
    assert 'src/TemplateEditor.jsx' in z.namelist()
    assert 'output/STEM_Klebanskyi_Frontend_Reports.docx' in z.namelist()
    assert all('node_modules' not in n and not n.startswith('tmp/') for n in z.namelist())
print(f'{archive}\n{len(set(files))} files; {archive.stat().st_size} bytes')
