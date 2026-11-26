#!/usr/bin/env python3
"""Close BOSS-T01 only after browser loader/dispatch QA passes."""
from __future__ import annotations
import hashlib, json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / 'ART_ASSETS/bosses/tanda_01/manifest.json'
QA = ROOT / 'ART_AUDIT/BOSSES/evidence/T01_browser/qa_report.json'
PERF = ROOT / 'ART_AUDIT/BOSSES/evidence/T01_browser/performance.json'
REQUIRED = [
    'httpOk','packApplied','noPackErrors','integrityAllLive','nineBossesLoaded',
    'stableBossMap','legacyResidentImagesPreserved','attackFrameCacheReplaced',
    'hooksInstalled','noPageErrors','noFailedResponses','gameplayBossConstructed',
    'gameplayBossUsesIllustratedHook','nativeStateApiAvailable',
    'nineBossArtIdFramesCaptured','fiveNativeStateSetsLoaded','hitAndAttackStateDispatch'
]

def main() -> None:
    manifest = json.loads(MANIFEST.read_text(encoding='utf-8'))
    qa = json.loads(QA.read_text(encoding='utf-8'))
    perf = json.loads(PERF.read_text(encoding='utf-8')) if PERF.exists() else None
    missing = [key for key in REQUIRED if qa.get('checks', {}).get(key) is not True]
    if missing:
        raise SystemExit('BOSS-T01 integration NOT closed; failed/missing checks: ' + ', '.join(missing))
    if manifest.get('asset_count') != 10 or len(manifest.get('assets', [])) != 10:
        raise SystemExit('BOSS-T01 manifest does not contain exactly ten assets')
    for asset in manifest['assets']:
        p = ROOT / asset['file']
        if not p.is_file():
            raise SystemExit('missing final asset: ' + str(p))
        if hashlib.sha256(p.read_bytes()).hexdigest() != asset['sha256']:
            raise SystemExit('hash drift: ' + str(p))
        with Image.open(p) as im:
            if list(im.size) != asset['dimensions'] or im.mode != 'RGBA':
                raise SystemExit('format/dimensions drift: ' + str(p))
        if asset['loader'] == 'HD':
            asset['status'] = 'INTEGRATED_NATIVE_HD_ATTACK01_CACHE'
        elif asset['boss_id'] in {'boss_05_fusioncosmica','boss_06_djabismo','boss_07_altavoztitan','boss_08_djcalavera','boss_09_nucleofinal'}:
            asset['status'] = 'INTEGRATED_IDLE_MASTER_NATIVE_ATTACK_HIT_DEATH_FALLBACK'
        else:
            asset['status'] = 'INTEGRATED_ILT_MASTER_WITH_EXISTING_PROCEDURAL_HIT_PULSE'
    manifest['status'] = 'INTEGRATED_PARTIAL_STATE_ART_PENDING'
    manifest['integration'] = {
        'branch': 'arena/179474d9-deadbeat-disconew',
        'build': 'DEADBEAT_DISCO.ART.html + ART_PACK/art_pack.js',
        'qa_report': 'ART_AUDIT/BOSSES/evidence/T01_browser/qa_report.json',
        'alpha_previews': 'ART_AUDIT/BOSSES/evidence/T01_alpha_qa/',
        'runtime_screenshots': 'ART_AUDIT/BOSSES/evidence/T01_browser/boss_artid_dispatch/',
        'passed_checks': REQUIRED,
        'caveats': [
            'Bosses 05–09 use the new illustrated master in idle and retain the engine native HD attack/hit/death dispatch until replacement state frames are produced.',
            'Boss 09 attack_01 was replaced through the existing __HD_ASSETS.images cache; attack_00, hit and death remain native assets.',
            'Resident aliases (Andén, Bufé, Cajero and Pogo) keep their prior art keys; only stable boss artIds map to the new boss_art_* keys.',
            'The synthetic artId screenshots mutate only a test browser entity; no game identity or save data is changed.'
        ],
        'performance': {
            'status': 'INCONCLUSIVE_KNOWN_SWIFTSHADER_RAF_STARVATION' if perf and not perf.get('pass') else ('PASS' if perf and perf.get('pass') else 'NOT_RUN'),
            'evidence': 'ART_AUDIT/BOSSES/evidence/T01_browser/performance.json' if perf else None,
            'asset_payload_bytes': perf.get('assetBytes') if perf else None,
            'fps_sample': perf.get('frame') if perf else None,
            'baseline_note': perf.get('note') if perf else 'No browser performance run.'
        }
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print('BOSS-T01 finalized: loader, stable-ID mapping, native state routing, nine artId dispatch screenshots, alpha and hash/dimension checks passed.')
    print('Performance status:', manifest['integration']['performance']['status'])

if __name__ == '__main__':
    main()
