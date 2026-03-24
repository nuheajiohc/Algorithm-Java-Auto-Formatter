const fs = require('node:fs');
const path = require('node:path');

test('SWEA 도메인 매치 패턴이 루트/서브도메인을 모두 포함한다', () => {
    const manifestPath = path.resolve(__dirname, '..', 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const script = manifest.content_scripts?.[0];
    const matches = script?.matches ?? [];

    expect(matches).toContain('*://swexpertacademy.com/*');
    expect(matches).toContain('*://www.swexpertacademy.com/*');
    expect(script.all_frames).toBe(true);
    expect(script.match_about_blank).toBe(true);
});
