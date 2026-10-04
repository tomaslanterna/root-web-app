import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import templates from '@capacitor/assets/dist/platforms/android/assets.js';

const assetRequire = createRequire(import.meta.resolve('@capacitor/assets'));
const sharp = assetRequire('sharp');
const resPath = new URL('../android/app/src/main/res/', import.meta.url);

for (const template of Object.values(templates).filter((item) => item.kind === 'icon')) {
  test(`Root icons replace Capacitor fallbacks at ${template.density}`, async () => {
    for (const name of ['ic_launcher', 'ic_launcher_round', 'ic_launcher_foreground']) {
      const file = fileURLToPath(new URL(`mipmap-${template.density}/${name}.png`, resPath));
      const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const foreground = name === 'ic_launcher_foreground';
      const size = foreground ? Math.round(template.width * 108 / 48) : template.width;
      assert.equal(info.width, size);
      assert.equal(info.height, size);
      let hasLime = false;
      let hasDarkGlyph = false;
      for (let pixel = 0; pixel < data.length; pixel += 4) {
        const [r, g, b, alpha] = data.subarray(pixel, pixel + 4);
        if (alpha < 240) continue;
        assert.ok(!(b > 180 && b > r + 40), `${file} contains the old blue icon`);
        hasLime ||= r > 140 && g > 180 && b < 80;
        hasDarkGlyph ||= r < 40 && g < 40 && b < 40;
      }
      assert.ok(hasDarkGlyph, `${file} is missing Root's glyph`);
      if (!foreground) assert.ok(hasLime, `${file} is missing Root's background`);
    }
  });
}
