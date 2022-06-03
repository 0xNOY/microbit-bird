class LEDMap {
    map: number[][];

    constructor(map: number[][] | null) {
        if (map == null || !this.is_valid_map(map)) {
            map = this.generate_empty_map();
        }
        this.map = map;
    }

    show() {
        for (let x = 0; x < 5; x++) {
            for (let y = 0; y < 5; y++) {
                led.plotBrightness(x, y, this.map[x][y]);
            }
        }
    }

    clear() {
        this.map = this.generate_empty_map();
    }

    putBrightness(x: number, y: number, brightness: number) {
        if (
            0 <= x && x < 5 &&
            0 <= y && y < 5 &&
            0 <= brightness && brightness <= 255 &&
            this.map[x][y] < brightness
            ) {
            this.map[x][y] = brightness;
        }
    }

    put(x: number, y: number) {
        this.putBrightness(x, y, 255);
    }

    private generate_empty_map(): number[][] {
        let map: number[][] = [];
        for (let x = 0; x < 5; x++) {
            map.push([]);
            for (let y = 0; y < 5; y++) {
                map[x].push(0);
            }
        }
        return map;
    }

    private is_valid_map(map: number[][]): boolean {
        let x = 0;
        if (map.length == 5) {
            for (x = 0; x < 5; x++) {
                if (map[x].length != 5) {
                    break;
                }
            }
        }
        if (x != 5) {
            return false;
        }
        return true;
    }
}

class Bird {
    position: number;
    loops_per_action: number;
    brightness: number;
    
    constructor() {
        this.position = 2;
        this.loops_per_action = 50;
        this.brightness = 128;
    }

    is_action_timing(n: number): boolean {
        return n % this.loops_per_action == 0
    }

    up() {
        if (this.position > 0) {
            this.position--;
        }
    }

    down() {
        if (this.position < 4) {
            this.position++;
        }
    }
}

class Stage {
    map: number[][];
    progress: number;
    loops_per_action: number;

    constructor(map: number[][] | null) {
        if (map == null || !this.is_valid_map(map))  {
            map = this.generate_random_map();
        }
        this.map = map;
        this.progress = 0;
        this.loops_per_action = 150;
    }

    is_action_timing(n: number): boolean {
        return n % this.loops_per_action == 0
    }

    is_finished(): boolean {
        return this.progress >= this.map.length-10
    }

    next() {
        if (this.progress < this.map.length-5) {
            this.progress++;
        }
    }

    get_square_map(): number[][] {
        let square_map: number[][] = [];
        this.map.slice(this.progress, this.progress+5).forEach(l => square_map.push(l.slice()));
        return square_map;
    }

    get_led_map(): LEDMap {
        let square_map = this.get_square_map();
        for (let x = 0; x < 5; x++) {
            for (let y = 0; y < 5; y++) {
                square_map[x][y] = square_map[x][y] == 0 ? 0: 255;
            }
        }
        return new LEDMap(square_map);
    }

    private is_valid_map(map: number[][]): boolean {
        let x = 0;
        for (; x < map.length; x++) {
            if (map[x].length != 5) {
                break;
            }
        }
        if (x != map.length-1) {
            return false;
        }
        return true;
    }

    private add_margin_to_map(map: number[][]): number[][]{
        let empty_line = [0, 0, 0, 0, 0];
        let margin_map = [];
        for (let x = 0; x < 5; x++) {
            margin_map.push(empty_line);
        }
        map = margin_map.concat(map).concat(margin_map).concat(margin_map);
        return map;
    }

    private generate_random_map(): number[][] {
        let map: number[][] = [];
        let section_number = randint(4, 6); // 障壁の数
        let loophole_position: number;
        for (let x = 0; x < (section_number-1)*4; x++) {
            let line = [0, 0, 0, 0, 0];
            if (x % 4 == 0) {
                loophole_position = randint(0, 4);
                for (let y = 0; y < 5; y++) {
                    if (y != loophole_position) {
                        line[y] = 1;
                    }
                }
            } else if (x % 2 == 0) {
                if (randint(0, 100) <= 80) {
                    line[loophole_position] = 1;
                }
            }
            map.push(line);
        }
        return this.add_margin_to_map(map);
    }
}

function start_game() {
    basic.clearScreen();
    const bird = new Bird();
    const stage = new Stage(null);
    let screen = new LEDMap(null);
    let n = 0;

    while (true) {
        if (bird.is_action_timing(n)) {
            if (input.isGesture(Gesture.LogoUp)) {
                bird.down();
            } else if (input.isGesture(Gesture.LogoDown)) {
                bird.up();
            }
        }

        if (stage.is_action_timing(n)) {
            if (bird.brightness < screen.map[0][bird.position]) {
                basic.showIcon(IconNames.Sad, 2000);
                break;
            }
            if (stage.is_finished()) {
                basic.showIcon(IconNames.Happy, 3000);
                break;
            }
            stage.next();
        }

        screen = stage.get_led_map();
        screen.putBrightness(0, bird.position, bird.brightness);
        screen.show();

        n++;
        basic.pause(1);
    }

    input.onGesture(Gesture.Shake, function(){control.reset()});
}

start_game();