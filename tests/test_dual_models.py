import unittest
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
ROOT=Path(__file__).resolve().parents[1]
class Refs(HTMLParser):
    def __init__(self):super().__init__();self.refs=[]
    def handle_starttag(self,tag,attrs):
        for key,value in attrs:
            if key in ('src','href') and value:self.refs.append(value)
class DualModelsTests(unittest.TestCase):
    def test_entrypoints_and_local_assets(self):
        for model in ('','nouveau/'):
            for page in ('index.html','mosae1.html','mosae2.html'):
                path=ROOT/(model+page);p=Refs();p.feed(path.read_text())
                for ref in p.refs:
                    u=urlsplit(ref)
                    if not u.scheme and not u.netloc and u.path:
                        self.assertTrue((path.parent/u.path).exists(),f'{path.name}: {ref}')
    def test_old_default_and_switches(self):
        for page in ('index.html','mosae1.html','mosae2.html'):
            self.assertIn('href="nouveau/'+page+'"',(ROOT/page).read_text())
            self.assertIn('data-legacy-link',(ROOT/'nouveau'/page).read_text())
        self.assertIn('Bienvenue sur MOSAE',(ROOT/'index.html').read_text())
    def test_shared_sources(self):
        for name in ('esgt_events.json','esgt_events2.json','univ_events.json','univ_events2.json'):
            self.assertTrue((ROOT/name).exists())
            self.assertFalse((ROOT/'nouveau'/name).exists())
        app=(ROOT/'nouveau/js/app.mjs').read_text()
        self.assertIn("from'../../js/data.mjs'",app)
        self.assertIn('new URL(meta.file,new URL("../",location.href))',app)
        self.assertIn("new URL('../feeds/'",app)
