// Regenerate only Android launcher icons, preserving splash screens and manifests.
// MIUI can display launcher icons instead of the notification's small icon.
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AndroidAssetGenerator } from '@capacitor/assets/dist/platforms/android/index.js';
import templates from '@capacitor/assets/dist/platforms/android/assets.js';
import { InputAsset } from '@capacitor/assets/dist/input-asset.js';

// Use the generator's Sharp version: loading two versions conflicts on Windows.
const assetRequire = createRequire(import.meta.resolve('@capacitor/assets'));
const sharp = assetRequire('sharp');

async function main() {
  const projectRoot = fileURLToPath(new URL('../', import.meta.url));
  const androidPath = path.join(projectRoot, 'android');
  const resPath = path.join(androidPath, 'app/src/main/res');
  const project = { config: { android: { path: androidPath } } };
  const generator = new AndroidAssetGenerator();
  const asset = new InputAsset(path.join(projectRoot, 'assets/icon.png'), 'icon', 'android');
  await asset.load();

  // Reuse the existing adaptive vector rather than maintaining another logo path.
  const vector = await readFile(path.join(resPath, 'drawable/ic_root_foreground.xml'), 'utf8');
  const attribute = (name) => {
    const match = vector.match(new RegExp(`android:${name}="([^"]+)"`));
    if (!match) throw new Error(`Missing ${name} in Root foreground vector`);
    return match[1];
  };
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="108" height="108" viewBox="0 0 108 108"><g transform="translate(${attribute('translateX')} ${attribute('translateY')}) scale(${attribute('scaleX')} ${attribute('scaleY')})"><path fill="${attribute('fillColor')}" d="${attribute('pathData')}"/></g></svg>`);

  for (const template of Object.values(templates).filter((item) => item.kind === 'icon')) {
    await generator.generateLegacyLauncherIcon(project, asset, template);
    await generator.generateRoundLauncherIcon(project, asset, template);
    const size = Math.round(template.width * 108 / 48);
    await sharp(svg).resize(size, size).png().toFile(
      path.join(resPath, `mipmap-${template.density}`, 'ic_launcher_foreground.png')
    );
  }
  console.log('Root launcher icons generated for all Android densities.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
