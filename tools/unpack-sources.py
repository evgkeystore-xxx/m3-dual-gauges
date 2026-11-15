#!/usr/bin/env python3
"""Expand all app source packages locally. Do not upload generated sources/ to GitHub."""
from pathlib import Path
import tarfile
root=Path(__file__).resolve().parent.parent
for f in sorted((root/'apps').glob('*/*.tgz')):
    target=root/'sources'/f.stem
    target.mkdir(parents=True, exist_ok=True)
    with tarfile.open(f) as archive:
        for member in archive.getmembers():
            dest=(target/member.name).resolve()
            if target.resolve() not in dest.parents or member.issym() or member.islnk() or not (member.isfile() or member.isdir()):
                raise RuntimeError('Unsafe archive path')
        for member in archive.getmembers():
            dest=target/member.name
            if member.isdir(): dest.mkdir(parents=True, exist_ok=True)
            elif member.isfile():
                dest.parent.mkdir(parents=True, exist_ok=True)
                with archive.extractfile(member) as src, open(dest,'wb') as dst:
                    import shutil
                    shutil.copyfileobj(src,dst)
    print(target)
