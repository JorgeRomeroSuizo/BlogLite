class SiteNav extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `<div class="TopNav">
        <a href="index.html" class="active">⌂</a>
        <div class="Links">
            <a href="Entrada1.html" class="Entradas">Entrada 1</a>
            <a href="Entrada2.html" class="Entradas">Entrada 2</a>
            <a href="Entrada3.html" class="Entradas">Entrada 3</a>
            <a href="Entrada4.html" class="Entradas">Entrada 4</a>
        </div>`;
    }
}
customElements.define('site-nav', SiteNav);
const container = document.getElementById('boxes');

const rand = (min, max) => Math.random() * (max - min) + min;
if (container) {



    const contents = [
        `<strong>Holaaa, bienvenido a mi blog.</strong>\nEste blog sera acerca de "Klara y el Sol" de Kazuo Ishiguro. Realmente disfrute el libro y espero que quien lea este blog tambien lo disfrute (el blog o el libro, cual sea funciona).`,
        `Creo que te habras dado cuenta de que el diseño de la pagina es algo extraño. Si te has leido el libro sera obvio el porque, y si no, espero que se haga claro a lo largo del blog. Pd: Recarga la pagina para ver cambiar el orden del texto.`,
        `<music-player></music-player>`,
        `<quote-reader></quote-reader>`,
        `<sun-counter></sun-counter>`,
        `<span id="textoextra">Hay un par de secretos escondidos en el blog con contenido extra. No tienen nada realmente importante pero si los encuentras espero te gusten.</span>`,
        `<egg-counter></egg-counter>`,
        ``,
        ``,
        `<a href="#" data-egg="ojo"><img src="Imagenes/ojo.png" alt=""></a>`,
        ``,
    ];





    const COUNT = 40;
    const GAP = -1.5;   // minimum separation, in vw/vh (use a negative number to allow a little overlap)

// 1. Find positions that respect the minimum gap
    const placed = [];

    for (let i = 0; i < COUNT; i++) {
        for (let attempt = 0; attempt < 100; attempt++) {
            const w = rand(20, 40);
            const h = rand(20, 40);
            const left = rand(5, 95 - w);
            const top = rand(5, 250 - h);

            const fits = placed.every(p =>
                left + w + GAP <= p.left ||
                p.left + p.w + GAP <= left ||
                top + h + GAP <= p.top ||
                p.top + p.h + GAP <= top
            );

            if (fits) {
                placed.push({ w, h, left, top });
                break;
            }
        }
    }


    placed.sort((a, b) => a.top - b.top);


    placed.forEach((p, i) => {
        const box = document.createElement('div');
        box.className = 'box';
        box.style.animationDelay = i * 0.25 + 's';
        box.innerHTML = contents[i] || '';

        box.style.width  = p.w + 'vw';
        box.style.height = p.h + 'vh';
        box.style.left   = p.left + 'vw';
        box.style.top    = p.top + 'vh';

        const lightness = rand(35, 60);
        const alpha = rand(0.15, 0.4);
        box.style.background = `hsla(0, 85%, ${lightness}%, ${alpha})`;

        const jitter = () => rand(0, 6) + '%';
        box.style.clipPath = `polygon(
    ${jitter()} ${jitter()},
    ${100 - parseFloat(jitter())}% ${jitter()},
    ${100 - parseFloat(jitter())}% ${100 - parseFloat(jitter())},
    ${jitter()} ${100 - parseFloat(jitter())}
  )`;

        container.appendChild(box);
    });
}

class InfoBox extends HTMLElement {
    connectedCallback() {
        const get = (name, fallback) => this.getAttribute(name) ?? fallback;

        this.style.width  = get('width', 30) + 'vw';
        this.style.height = get('height', 20) + 'vh';
        this.style.left   = get('left', 0) + 'vw';
        this.style.top    = get('top', 0) + 'vh';
        if (this.hasAttribute('z')) this.style.zIndex = get('z');

        this.style.background = `hsla(0, 85%, ${rand(35, 60)}%, ${rand(0.15, 0.4)})`;
    }
}
customElements.define('info-box', InfoBox);

const FALLBACK = { lat: 14.6333, lng: -90.6064, name: 'Mixco, Guatemala' };

class SunCounter extends HTMLElement {
    connectedCallback() {
        this.innerHTML = 'Cargando...';
        if (!navigator.geolocation) return this.start(FALLBACK);

        navigator.geolocation.getCurrentPosition(
            async pos => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                this.start({ lat, lng, name: await this.getPlaceName(lat, lng) });
            },
            () => this.start(FALLBACK)
        );
    }
    async getPlaceName(lat, lng) {
        try {
            const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=es`;
            const r = await (await fetch(url)).json();
            const city = r.city || r.locality || r.principalSubdivision;
            return [city, r.countryName].filter(Boolean).join(', ') || 'tu ubicación';
        } catch {
            return 'tu ubicación';
        }
    }
    async start(place) {
        // Ask the API for the sunrise/sunset of one day (0 = today, 1 = tomorrow)
        const getDay = async offset => {
            const d = new Date();
            d.setDate(d.getDate() + offset);
            const date = d.toLocaleDateString('en-CA');   // format YYYY-MM-DD
            const url = `https://api.sunrise-sunset.org/json?lat=${place.lat}&lng=${place.lng}&date=${date}&formatted=0`;
            const r = (await (await fetch(url)).json()).results;
            return [
                { label: 'el amanecer.', time: new Date(r.sunrise) },
                { label: 'el atardecer.', time: new Date(r.sunset) }
            ];
        };

        let events;
        try {
            events = [...await getDay(0), ...await getDay(1)];
        } catch {
            this.innerHTML = 'No se pudo obtener la hora del amanecer/atardecer.';
            return;
        }

        const pad = n => String(n).padStart(2, '0');

        const tick = () => {
            const now = new Date();
            const next = events.find(e => e.time > now);
            if (!next) {
                clearInterval(this.timer);
                return this.start(place);
            }

            const s = Math.floor((next.time - now) / 1000);
            const h = Math.floor(s / 3600);
            const m = Math.floor((s % 3600) / 60);
            const sec = s % 60;

            this.innerHTML =
                `Faltan ${pad(h)}:${pad(m)}:${pad(sec)} para ${next.label}` +
                `<br><small>${place.name}</small>`;
        };

        tick();
        this.timer = setInterval(tick, 1000);
    }

    disconnectedCallback() {
        clearInterval(this.timer);
    }
}
customElements.define('sun-counter', SunCounter);


const SONGS = [
    { name: 'Cloud Nine(9) - Passage Of Time', url: 'Musica/Cloud Nine(9) - Passage Of Time [d-OPH3rP024].mp3' },
    { name: 'Chopin： Nocturne Op.48 No.1 in C Minor (Ashkenazy)', url: 'Musica/Chopin： Nocturne Op.48 No.1 in C Minor (Ashkenazy) [107Iwx5RKSM].mp3' },
    { name: 'CUARTETO DE NOS ｜ COMO PASA EL TIEMPO', url: 'Musica/CUARTETO DE NOS ｜ COMO PASA EL TIEMPO (Video Oficial) [iro4aGaKVZ8].mp3' },
    { name: 'Scriabin - Piano Sonata No. 4, Op. 30 (Pogorelich)', url: 'Musica/Scriabin - Piano Sonata No. 4, Op. 30 (Pogorelich) [k9BZWNBFV1U].mp3' },
    { name: 'Hello Planet! -Hatsune Miku', url: 'Musica/PlanetfeatMiku Hatsune [oVb6Gkf-IJM].mp3' },


];
const HIDDEN_SONG = { name: 'SECRETO!!!!!!!\nwowaka\n World\'s End\n Dance\n Hall\n\nPista: Revisa bien la entrada 2', url: 'Musica/wowaka Worlds End Dance Hall.mp3' };
const SKIPS_NEEDED = 15;
class MusicPlayer extends HTMLElement {
    connectedCallback() {
        this.songs = SONGS;        // the list you defined above
        this.index = 0;
        this.skips = 0;
        this.audio = new Audio();
        this.audio.volume = 0.3;   // starting volume, from 0 (mute) to 1 (max)

        this.innerHTML = `
            <div class="mp-title">Sin canciones</div>
            <input type="range" class="mp-bar" value="0" min="0" max="100">
            <div class="mp-buttons">
                <button class="mp-prev">⏮</button>
                <button class="mp-play">▶</button>
                <button class="mp-next">⏭</button>
            </div>
            <span class="mp-text">Estas son canciones que creo que se sienten como el libro >:3</span>`;

        const $ = selector => this.querySelector(selector);
        this.titleEl = $('.mp-title');
        const bar = $('.mp-bar');
        const playBtn = $('.mp-play');

        playBtn.addEventListener('click', () => {
            if (!this.songs.length) return;
            this.audio.paused ? this.audio.play() : this.audio.pause();
        });

        const press = dir => {
            this.skips++;
            if (this.skips === SKIPS_NEEDED) return this.playHidden();
            this.skip(dir);
        };
        $('.mp-prev').addEventListener('click', () => press(-1));
        $('.mp-next').addEventListener('click', () => press(1));

        this.audio.addEventListener('play',  () => playBtn.textContent = '⏸');
        this.audio.addEventListener('pause', () => playBtn.textContent = '▶');
        this.audio.addEventListener('ended', () => this.skip(1));
        this.audio.addEventListener('timeupdate', () => {
            if (this.audio.duration)
                bar.value = this.audio.currentTime / this.audio.duration * 100;
        });
        bar.addEventListener('input', () => {
            if (this.audio.duration)
                this.audio.currentTime = bar.value / 100 * this.audio.duration;
        });
        if (this.songs.length) this.load(0, false);
    }

    load(i, autoplay = true) {
        this.index = i;
        this.audio.src = this.songs[i].url;
        this.titleEl.textContent = this.songs[i].name;
        if (autoplay) this.audio.play();
    }

    skip(dir) {
        if (!this.songs.length) return;
        this.load((this.index + dir + this.songs.length) % this.songs.length);
    }

    playHidden() {
        this.audio.src = HIDDEN_SONG.url;
        this.titleEl.textContent = HIDDEN_SONG.name;
        this.audio.play();
        foundEgg('cancion-secreta');
    }

    disconnectedCallback() {
        this.audio.pause();
    }
}
customElements.define('music-player', MusicPlayer);


const QUOTES = [
    { text: 'Una vez esté ahí afuera, sé que siempre estaré buscando a alguien justo como ella. Al menos como la Josie que una vez conocí.', author: 'Rick, Klara y el Sol' },
    { text: 'Esperanza… Jodida cosa nunca te deja solo.',                     author: 'Paul, Klara y el Sol' },
    { text: 'Tienen maneras toscas, pero puede que no sean tan crueles. Temen la soledad, y por eso se comportan como lo hacen. Quizás Josie también.',                     author: 'Klara, Klara y el Sol' },
];

class QuoteReader extends HTMLElement {
    connectedCallback() {
        this.current = -1;
        this.title = 'Clic para otra cita';
        this.next();
        this.addEventListener('click', () => this.next());
    }

    next() {
        let n;
        do {
            n = Math.floor(Math.random() * QUOTES.length);
        } while (n === this.current && QUOTES.length > 1);

        this.current = n;
        const q = QUOTES[n];
        this.innerHTML = `<blockquote>“${q.text}”</blockquote>— ${q.author}`;
    }
}
customElements.define('quote-reader', QuoteReader);



const TOTAL_EGGS = 4;   // how many easter eggs exist in your blog

function getEggs() {
    try { return JSON.parse(localStorage.getItem('eggs')) || []; }
    catch { return []; }
}

function foundEgg(id) {
    const eggs = getEggs();
    if (eggs.includes(id)) return;               // already found, don't count twice
    eggs.push(id);
    localStorage.setItem('eggs', JSON.stringify(eggs));
    window.dispatchEvent(new Event('eggs-changed'));
}

class EggCounter extends HTMLElement {
    connectedCallback() {
        this.render();
        this.onChange = () => this.render();
        window.addEventListener('eggs-changed', this.onChange);
    }

    render() {
        this.innerHTML = `Secretos encontrados:<br> ${getEggs().length} / ${TOTAL_EGGS}`;
    }

    disconnectedCallback() {
        window.removeEventListener('eggs-changed', this.onChange);
    }
}
customElements.define('egg-counter', EggCounter);
function explode(src) {
    const COUNT = 7000;     // how many images
    const DELAY = 35;     // ms between one image and the next

    const layer = document.createElement('div');
    layer.className = 'egg-layer';

    for (let i = 0; i < COUNT; i++) {
        const img = document.createElement('img');
        img.src = src;
        img.className = 'egg-img';
        img.style.width = rand(15, 30) + 'vw';
        img.style.left = rand(-5, 105) + 'vw';
        img.style.top = rand(-5, 105) + 'vh';
        img.style.rotate = rand(-15, 15) + 'deg';
        img.style.animationDelay = i * DELAY + 'ms';
        layer.appendChild(img);
    }
    document.body.appendChild(layer);

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
}
document.addEventListener('click', e => {
    const egg = e.target.closest('[data-egg]');
    if (!egg) return;

    const href = egg.getAttribute('href');
    const realLink = href && href !== '#';

    if (!realLink) e.preventDefault();
    foundEgg(egg.dataset.egg);

    const src = egg.dataset.img || egg.querySelector('img')?.src;
    if (src && !realLink) explode(src);
});

class BoxMap extends HTMLElement {
    connectedCallback() {
        this.insertAdjacentHTML('afterbegin', '<svg class="bm-lines"></svg>');
        const svg = this.querySelector('.bm-lines');

        this.draw = () => {
            const map = this.getBoundingClientRect();

            // size and center of a box, measured from the map's top-left corner
            const box = id => {
                const el = this.querySelector(`[id="${id}"]`);
                if (!el) return null;
                const r = el.getBoundingClientRect();
                return {
                    cx: r.left - map.left + r.width / 2,
                    cy: r.top - map.top + r.height / 2,
                    hw: r.width / 2,
                    hh: r.height / 2
                };
            };

            // point where a line leaving the box's center, in direction (dx, dy), crosses its edge
            const edge = (b, dx, dy) => {
                const t = Math.min(
                    dx ? b.hw / Math.abs(dx) : Infinity,
                    dy ? b.hh / Math.abs(dy) : Infinity
                );
                return [b.cx + dx * t, b.cy + dy * t];
            };

            const pairs = (this.getAttribute('links') || '').split(',');

            svg.innerHTML = pairs.map(pair => {
                const [idA, idB] = pair.trim().split(/\s+/);
                const a = box(idA);
                const b = box(idB);
                if (!a || !b) return '';

                const dx = b.cx - a.cx;
                const dy = b.cy - a.cy;
                const [x1, y1] = edge(a, dx, dy);
                const [x2, y2] = edge(b, -dx, -dy);
                return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
            }).join('');
        };

        requestAnimationFrame(this.draw);
        window.addEventListener('resize', this.draw);
    }

    disconnectedCallback() {
        window.removeEventListener('resize', this.draw);
    }
}
customElements.define('box-map', BoxMap);


class SunRays extends HTMLElement {
    connectedCallback() {
        const FAN = 5;          // degrees of tilt between one ray and the next (was 1.5)
        const JITTER = 1;       // random extra tilt per ray, in degrees    // degrees of tilt between one ray and the next (0 = all straight)
        const SUN_BOXES = 7;    // how many boxes make up the sun
        const PIECES = 8;       // how many small boxes make up each ray

        // creates one small decorative box (all values in %, rotation in degrees)
        const piece = (w, h, left, top, rot) => {
            const b = document.createElement('div');
            b.style.width  = w + '%';
            b.style.height = h + '%';
            b.style.left   = left + '%';
            b.style.top    = top + '%';
            b.style.rotate = rot + 'deg';
            b.style.background = `hsla(0, 85%, ${rand(35, 60)}%, ${rand(0.15, 0.4)})`;
            return b;
        };

        const rays = [...this.children];
        const mid = (rays.length - 1) / 2;
        this.style.setProperty('--tilt', mid * FAN + JITTER + 'deg');

        // 1. The sun: a cluster of overlapping boxes
        const sun = document.createElement('div');
        sun.className = 'sr-sun';

        for (let i = 0; i < SUN_BOXES; i++) {
            const size = rand(35, 60);
            const angle = (i / SUN_BOXES) * 2 * Math.PI;
            const dist = rand(8, 20);
            sun.appendChild(piece(
                size, size,
                50 + dist * Math.cos(angle) - size / 2,
                50 + dist * Math.sin(angle) - size / 2,
                rand(-25, 25)
            ));
        }
        this.prepend(sun);

        // 2. The rays: your text on top of a row of small boxes
        rays.forEach((ray, i) => {
            ray.classList.add('sr-ray');
            ray.style.rotate = (i - mid) * FAN + rand(-JITTER, JITTER) + 'deg';
            ray.style.marginRight = rand(2, 12) + 'vw';

            const trail = document.createElement('div');
            trail.className = 'sr-trail';

            for (let j = 0; j < PIECES; j++) {
                const w = rand(14, 24);
                const h = rand(40, 80);
                trail.appendChild(piece(
                    w, h,
                    (j / (PIECES - 1)) * (100 - w),
                    rand(0, 100 - h),
                    rand(-4, 4)
                ));
            }
            ray.prepend(trail);
        });
    }
}
customElements.define('sun-rays', SunRays);


class CitySkyline extends HTMLElement {
    connectedCallback() {
        if (this.built) return;        // never build the city twice
        this.built = true;

        const CELL = 12;           // size of one window slot, in px
        const WIN = 5;             // size of a lit window, in px
        const LIT = 0.35;          // chance that a window is lit (0 to 1)
        const ROOF = [12, 34];     // window rows above the text of a text building (min, max)
        const TALL = [16, 52];     // window rows of a thin building (min, max)
        const FILLER_EVERY = 110;  // one thin building for every this many px of city width

        this.style.setProperty('--cell', CELL + 'px');

        const rowsIn = ([min, max]) => Math.floor(rand(min, max + 1));

        // your tags become the text buildings
        const texts = [...this.children];
        texts.forEach(t => {
            const rows = rowsIn(ROOF);
            t.classList.add('cs-building');
            t.dataset.rows = rows;
            t.style.paddingTop = rows * CELL + 'px';
        });

        // thin buildings, scattered at random between and around the text buildings
        const textsWidth = texts.reduce((sum, t) => sum + t.offsetWidth, 0);
        const count = Math.round(Math.max(window.innerWidth, textsWidth) / FILLER_EVERY);

        for (let i = 0; i < count; i++) {
            const rows = rowsIn(TALL);
            const f = document.createElement('div');
            f.className = 'cs-filler';
            f.dataset.rows = rows;
            f.style.height = rows * CELL + 'px';
            f.style.flexGrow = rand(1, 3);

            const slot = Math.floor(rand(0, texts.length + 1));
            slot < texts.length ? texts[slot].before(f) : this.append(f);
        }

        // draws the lit windows
        const pad = (CELL - 1) / 2;     // offset that centers a window in its slot
        const spread = (WIN - 1) / 2;   // grows a 1px dot into a WIN-sized square

        this.lights = () => {
            // 1. read every size first
            const items = [...this.querySelectorAll('[data-rows]')].map(b => ({
                b,
                rows: +b.dataset.rows,
                cols: Math.floor(b.clientWidth / CELL)
            }));

            // 2. then write
            this.querySelectorAll('.cs-windows').forEach(w => w.remove());

            items.forEach(({ b, rows, cols }) => {
                const bright = [];
                const dim = [];

                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        if (Math.random() > LIT) continue;
                        const shadow = `${c * CELL + pad}px ${r * CELL + pad}px 0 ${spread}px`;
                        (Math.random() < 0.5 ? bright : dim).push(shadow);
                    }
                }

                const layer = document.createElement('div');
                layer.className = 'cs-windows';
                layer.style.height = rows * CELL + 'px';
                layer.innerHTML =
                    `<i class="bright" style="box-shadow: ${bright.join(',')}"></i>` +
                    `<i class="dim" style="box-shadow: ${dim.join(',')}"></i>`;
                b.prepend(layer);
            });
        };

        // redraw only when the width changes, and only once the resizing stops
        let lastWidth = window.innerWidth;
        window.addEventListener('resize', () => {
            if (window.innerWidth === lastWidth) return;
            lastWidth = window.innerWidth;
            clearTimeout(this.timer);
            this.timer = setTimeout(this.lights, 200);
        });

        requestAnimationFrame(this.lights);
    }
}
customElements.define('city-skyline', CitySkyline);


const SECRET_ORDER = ['index.html', 'Entrada2.html', 'Entrada2.html', 'Entrada4.html', 'Entrada1.html', 'Entrada1.html'];
const BONUS_PAGE = 'Disenio.html';

document.addEventListener('click', e => {
    const link = e.target.closest('.TopNav a');
    if (!link) return;

    let clicks = [];
    try { clicks = JSON.parse(sessionStorage.getItem('navClicks')) || []; }
    catch {}

    clicks.push(link.getAttribute('href'));
    clicks = clicks.slice(-SECRET_ORDER.length);
    sessionStorage.setItem('navClicks', JSON.stringify(clicks));

    if (clicks.join() === SECRET_ORDER.join()) {
        e.preventDefault();
        sessionStorage.removeItem('navClicks');
        foundEgg('pagina-bonus');
        location.href = new URL(BONUS_PAGE, link.href);
    }
});