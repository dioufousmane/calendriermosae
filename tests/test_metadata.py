import unittest
from types import SimpleNamespace
from event_metadata import extract_metadata
class MetadataTests(unittest.TestCase):
    def test_esgt(self):
        e=SimpleNamespace(description='Promotions : MF1, MOSAE1\\nGroupes : A, B',uid='x',name='SIG')
        self.assertEqual(extract_metadata(e)['promotions'], ['MF1','MOSAE 1'])
        self.assertEqual(extract_metadata(e)['groups'], ['A','B'])
    def test_ade(self):
        e=SimpleNamespace(description='P - M1 MOSAE\nM1 MOSAE GEOGRAPHIE, AMENAGEMENT\nP - M1 S1 URBANISTIC\nP - M1 S1 MATTERRE',uid='y',name='Ville durable')
        self.assertEqual(extract_metadata(e)['promotions'], ['M1 MATTERRE','M1 URBANISTIC','MOSAE 1'])
if __name__=='__main__':unittest.main()

class ExtendedPublicTests(unittest.TestCase):
    def test_all_explicit_ade_publics(self):
        e=SimpleNamespace(description='M1 LEA Semestre 7\nM2 DDL Présentiel - S1\nM1 MEEF PIF (IFUNO)\nM1 VILLE ET ENVIRONNEMENTS URBAINS S1\nM1 VILLE ET ENVIRONNEMENTS URBAINS S2\nDIOUF OUSMANE',uid='ade',name='Langue')
        data=extract_metadata(e)
        self.assertEqual(len(data['promotions']),4)
        self.assertNotIn('DIOUF OUSMANE',data['promotions'])
    def test_hp_shared_identity_and_institution_exclusion(self):
        a=extract_metadata(SimpleNamespace(description='Promotions : ESGT, MOSAE1, MOSAE2',uid='Cours-4532-4-MOSAE1-Index-Education',name='Soutenance'))
        b=extract_metadata(SimpleNamespace(description='Promotions : MOSAE1, MOSAE2',uid='Cours-4532-4-MOSAE2-Index-Education',name='Soutenance'))
        self.assertEqual(a['session_id'],b['session_id'])
        self.assertEqual(a['promotions'],['MOSAE 1','MOSAE 2'])
