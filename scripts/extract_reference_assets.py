"""One-time reference asset extraction. Never used by the production app."""
from pathlib import Path
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parent.parent
ASSETS = {
    'image1.jpeg': 'watermark.jpeg',
    'image6.png': 'clippers.png',
    'image2.svg': 'meeting.svg',
    'image3.svg': 'court.svg',
    'image4.svg': 'table.svg',
    'image5.svg': 'performance.svg',
    'image7.png': 'warriors.png',
    'image9.png': 'thunder.png',
    'image11.png': 'kings.png',
    'image8.png': 'trailblazers.png',
    'image14.png': 'pacers.png',
    'image15.png': 'raptors.png',
    'image10.png': 'mavericks.png',
    'image12.png': 'spurs.png',
    'image13.png': 'bucks.png',
    'image16.png': 'pelicans.png',
    'image17.png': 'bulls.png',
    'image18.png': 'timberwolves.png',
    'image19.png': 'knicks.png',
    'image20.png': 'grizzlies.png',
    'image21.png': 'magic.png',
    'image22.png': 'lakers.png',
    'image23.png': 'nuggets.png',
    'image24.png': 'rockets.png',
    'image25.png': 'cavaliers.png',
    'image26.png': '76ers.png',
    'image27.png': 'suns.png',
    'image28.png': 'jazz.png',
    'image29.png': 'nets.png',
    'image30.png': 'wizards.png',
    'image31.png': 'hornets.png',
    'image32.png': 'pistons.png',
    'image33.png': 'celtics.png',
    'image36.png': 'hawks.png',
    'image37.png': 'heat.png',
    'image54.png': 'loong-lions.png',
}

if __name__ == '__main__':
    destination = ROOT / 'public' / 'assets'
    destination.mkdir(parents=True, exist_ok=True)
    with ZipFile(ROOT / 'ShootingTimesTemplate_25-26.pptx') as archive:
        for source, target in ASSETS.items():
            (destination / target).write_bytes(archive.read('ppt/media/' + source))
    print(f'Extracted {len(ASSETS)} approved reference assets to {destination}')
