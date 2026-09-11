"""Conserve les publics explicitement indiqués dans les descriptions ICS."""
import re

def canonical_public(value):
    value = re.sub(r'\s+', ' ', value).strip(' ,;')
    value = re.sub(r'^P\s*-\s*', '', value, flags=re.I)
    value = re.sub(r'^(M[12])\s+S[1-4]\s+', r'\1 ', value, flags=re.I)
    match = re.fullmatch(r'(?:M([12])\s+MOSAE(?:\s+GEOGRAPHIE.*)?|MOSAE\s*([12]))', value, re.I)
    if match:
        return 'MOSAE ' + (match.group(1) or match.group(2))
    # Semester is not a second promotion; preserve named specialisations.
    value = re.sub(r'\s*(?:-\s*)?(?:S[1-4]|Semestre\s+\d+)\s*$', '', value, flags=re.I).strip()
    return value.upper()

def extract_metadata(event):
    description = str(event.description or '').replace('\\n', '\n').replace('\\,', ',')
    promotions, groups, formations = [], [], []
    for line in description.splitlines():
        explicit = re.match(r'\s*(Promotions?|Groupes?|Formations?)\s*:\s*(.+)', line, re.I)
        if explicit:
            label, values = explicit.groups()
            target = groups if label.lower().startswith('groupe') else formations if label.lower().startswith('formation') else promotions
            target.extend(canonical_public(x) for x in re.split(r'[,;]', values) if x.strip())
            continue
        # ADE: a public occupies a full line; do not split descriptive commas.
        if re.match(r'^\s*(?:P\s*-\s*)?(?:M[12]\s+|IG\s*\d+\b|MF\s*\d+\b|MOSAE\s*[12]\b|LP\s+|UEO\s+)', line, re.I):
            promotions.append(canonical_public(line))
    # ESGT alone is an institution, not another promotion.
    promotions = [p for p in promotions if p not in ('ESGT', 'UNIV', 'UNIVERSITE DU MANS')]
    uid = str(event.uid or '')
    hp = re.fullmatch(r'(Cours-\d+-\d+)-MOSAE[12]-Index-Education', uid)
    session_id = 'HYPERPLANNING:' + hp.group(1) if hp and len(set(promotions)) > 1 else ''
    return {'uid': uid, 'session_id': session_id, 'raw_title': str(event.name or ''),
            'promotions': sorted(set(promotions)), 'groups': sorted(set(groups)),
            'formations': sorted(set(formations))}
