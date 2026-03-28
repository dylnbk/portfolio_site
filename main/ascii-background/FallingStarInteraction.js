/**
 * Falling Star Interaction
 * Drives cursor-like comet trails automatically across the background.
 */
export class FallingStarInteraction {
    constructor(asciiGrid, performanceMode = 'high') {
        this.asciiGrid = asciiGrid;
        this.performanceMode = performanceMode;

        this.gridDimensions = null;
        this.cellSize = 10;
        this.viewportWidth = window.innerWidth;
        this.viewportHeight = window.innerHeight;

        this.excitementMap = new Map();
        this.activeStars = [];

        this.excitementDecay = 0.955;
        this.maxExcitement = 1.4;
        this.maxChaosMultiplier = 8;
        this.spawnAccumulator = 0;
        this.isInitialized = false;

        this.prefersReducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.prefersReducedMotion = this.prefersReducedMotionQuery.matches;
        this.boundMotionPreferenceChange = this.handleMotionPreferenceChange.bind(this);

        this.initialize();
    }

    initialize() {
        this.updateGridDimensions();
        this.config = this.createConfig();
        this.observeMotionPreference();
        this.seedInitialStars();
        this.isInitialized = true;
    }

    createConfig() {
        if (this.prefersReducedMotion) {
            return {
                enabled: false,
                maxStars: 0,
                spawnRate: 0
            };
        }

        const width = this.gridDimensions?.width || 80;

        switch (this.performanceMode) {
            case 'low':
                return {
                    enabled: true,
                    maxStars: this.clamp(Math.floor(width * 0.018), 1, 2),
                    spawnRate: 0.18,
                    initialFillRatio: 0.5,
                    minRadius: 12,
                    maxRadius: 32,
                    minSpeed: 60,
                    maxSpeed: 95,
                    minIntensity: 0.86,
                    maxIntensity: 1,
                    minSparkleChance: 0.18,
                    maxSparkleChance: 0.34,
                    spawnSpacing: 160,
                    minTailLengthMultiplier: 1.05,
                    maxTailLengthMultiplier: 1.45,
                    longTailChance: 0.25,
                    minLongTailBoost: 1.2,
                    maxLongTailBoost: 1.55
                };
            case 'medium':
                return {
                    enabled: true,
                    maxStars: this.clamp(Math.floor(width * 0.025), 1, 4),
                    spawnRate: 0.24,
                    initialFillRatio: 0.52,
                    minRadius: 14,
                    maxRadius: 42,
                    minSpeed: 75,
                    maxSpeed: 115,
                    minIntensity: 0.9,
                    maxIntensity: 1.08,
                    minSparkleChance: 0.24,
                    maxSparkleChance: 0.42,
                    spawnSpacing: 200,
                    minTailLengthMultiplier: 1.15,
                    maxTailLengthMultiplier: 1.7,
                    longTailChance: 0.32,
                    minLongTailBoost: 1.25,
                    maxLongTailBoost: 1.75
                };
            case 'high':
            default:
                return {
                    enabled: true,
                    maxStars: this.clamp(Math.floor(width * 0.032), 2, 5),
                    spawnRate: 0.32,
                    initialFillRatio: 0.56,
                    minRadius: 16,
                    maxRadius: 54,
                    minSpeed: 90,
                    maxSpeed: 135,
                    minIntensity: 0.95,
                    maxIntensity: 1.14,
                    minSparkleChance: 0.3,
                    maxSparkleChance: 0.5,
                    spawnSpacing: 240,
                    minTailLengthMultiplier: 1.2,
                    maxTailLengthMultiplier: 1.9,
                    longTailChance: 0.38,
                    minLongTailBoost: 1.35,
                    maxLongTailBoost: 1.95
                };
        }
    }

    observeMotionPreference() {
        if (typeof this.prefersReducedMotionQuery.addEventListener === 'function') {
            this.prefersReducedMotionQuery.addEventListener('change', this.boundMotionPreferenceChange);
            return;
        }

        if (typeof this.prefersReducedMotionQuery.addListener === 'function') {
            this.prefersReducedMotionQuery.addListener(this.boundMotionPreferenceChange);
        }
    }

    handleMotionPreferenceChange(event) {
        this.prefersReducedMotion = event.matches;
        this.config = this.createConfig();

        if (!this.config.enabled) {
            this.clear();
            return;
        }

        this.clear();
        this.seedInitialStars();
    }

    clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    randomBetween(min, max) {
        return min + Math.random() * (max - min);
    }

    lerp(start, end, t) {
        return start + (end - start) * t;
    }

    updateGridDimensions() {
        this.gridDimensions = this.asciiGrid.getDimensions();
        this.cellSize = this.gridDimensions.cellSize;
        this.viewportWidth = window.innerWidth;
        this.viewportHeight = window.innerHeight;
        this.config = this.createConfig();

        this.activeStars = this.activeStars.filter((star) => {
            return star.x > -star.radius * 3 && star.x < this.viewportWidth + star.radius * 3;
        });

        if (this.config.enabled && this.activeStars.length === 0) {
            this.seedInitialStars();
        }
    }

    seedInitialStars() {
        if (!this.config.enabled) {
            return;
        }

        const initialCount = Math.max(
            1,
            Math.floor(this.config.maxStars * this.config.initialFillRatio)
        );

        for (let index = this.activeStars.length; index < initialCount; index++) {
            const star = this.createStar(true);
            if (!star) {
                break;
            }

            this.activeStars.push(star);
            this.stampCurrentStar(star, true);
        }
    }

    createStar(seedAcrossViewport = false) {
        if (!this.config.enabled || this.activeStars.length >= this.config.maxStars) {
            return null;
        }

        const radius = this.randomBetween(this.config.minRadius, this.config.maxRadius);
        const x = this.pickSpawnX(radius);
        if (x === null) {
            return null;
        }

        const y = seedAcrossViewport
            ? this.randomBetween(-radius, this.viewportHeight + radius)
            : this.randomBetween(-radius * 2, -radius * 0.35);
        const baseTailLengthMultiplier = this.randomBetween(
            this.config.minTailLengthMultiplier,
            this.config.maxTailLengthMultiplier
        );
        const tailLengthMultiplier = Math.random() < this.config.longTailChance
            ? baseTailLengthMultiplier * this.randomBetween(
                this.config.minLongTailBoost,
                this.config.maxLongTailBoost
            )
            : baseTailLengthMultiplier;

        return {
            radius,
            x,
            y,
            previousX: x,
            previousY: y,
            age: this.randomBetween(0, Math.PI * 2),
            phase: this.randomBetween(0, Math.PI * 2),
            speed: this.randomBetween(this.config.minSpeed, this.config.maxSpeed),
            intensity: this.randomBetween(this.config.minIntensity, this.config.maxIntensity),
            sparkleChance: this.randomBetween(this.config.minSparkleChance, this.config.maxSparkleChance),
            tailLengthMultiplier
        };
    }

    pickSpawnX(radius) {
        if (this.viewportWidth <= 0) {
            return null;
        }

        const padding = radius * 1.2;

        for (let attempt = 0; attempt < 16; attempt++) {
            const candidate = this.randomBetween(padding, Math.max(padding + 1, this.viewportWidth - padding));
            const isFarEnough = this.activeStars.every((star) => {
                const spacing = Math.max(this.config.spawnSpacing, (star.radius + radius) * 1.35);
                return Math.abs(star.x - candidate) >= spacing;
            });

            if (isFarEnough) {
                return candidate;
            }
        }

        if (this.activeStars.length < this.config.maxStars) {
            return this.randomBetween(padding, Math.max(padding + 1, this.viewportWidth - padding));
        }

        return null;
    }

    stampExcitement(centerX, centerY, influenceRadius, intensityMultiplier = 1) {
        const gridX = Math.floor(centerX / this.cellSize);
        const gridY = Math.floor(centerY / this.cellSize);
        const influenceGridRadius = Math.ceil(influenceRadius / this.cellSize);

        for (let x = Math.max(0, gridX - influenceGridRadius);
             x < Math.min(this.gridDimensions.width, gridX + influenceGridRadius + 1);
             x++) {
            for (let y = Math.max(0, gridY - influenceGridRadius);
                 y < Math.min(this.gridDimensions.height, gridY + influenceGridRadius + 1);
                 y++) {
                const cellScreenX = (x + 0.5) * this.cellSize;
                const cellScreenY = (y + 0.5) * this.cellSize;
                const distance = Math.sqrt(
                    Math.pow(centerX - cellScreenX, 2) +
                    Math.pow(centerY - cellScreenY, 2)
                );

                if (distance > influenceRadius) {
                    continue;
                }

                const normalizedDistance = distance / influenceRadius;
                const excitement = this.clamp(
                    Math.pow(1 - normalizedDistance, 1.3) * 1.4 * intensityMultiplier,
                    0,
                    this.maxExcitement
                );
                const key = `${x},${y}`;
                const currentExcitement = this.excitementMap.get(key) || 0;
                this.excitementMap.set(key, Math.max(currentExcitement, excitement));
            }
        }
    }

    stampCurrentStar(star, includeSparkles = false) {
        this.stampExcitement(star.x, star.y, star.radius * 1.06, star.intensity * 1.08);

        if (includeSparkles) {
            this.emitSparkles(star, true);
        }
    }

    stampTrail(star) {
        const distance = Math.hypot(star.x - star.previousX, star.y - star.previousY);
        const tailDistance = Math.max(
            distance * (2.5 + star.tailLengthMultiplier * 1.5),
            star.radius * (0.75 + star.tailLengthMultiplier * 0.55)
        );
        const stepSize = Math.max(this.cellSize * 0.7, star.radius * 0.22);
        const steps = Math.max(1, Math.ceil(tailDistance / stepSize));

        for (let index = 0; index <= steps; index++) {
            const t = index / steps;
            const sampleX = this.lerp(star.previousX, star.x, t);
            const sampleY = star.y - (tailDistance * (1 - t));
            const headBias = Math.pow(t, 1.1);
            const trailRadius = star.radius * (0.34 + 0.8 * headBias);
            const pulse = 0.92 + Math.sin((star.age * 4.2) + (t * 1.8) + star.phase) * 0.08;
            const intensity = star.intensity * (0.22 + 0.9 * headBias) * pulse;

            this.stampExcitement(sampleX, sampleY, trailRadius, intensity);
        }

        this.stampExcitement(star.x, star.y, star.radius * 1.12, star.intensity * 1.14);
        this.emitSparkles(star);
    }

    emitSparkles(star, force = false) {
        const sparkleBursts = star.radius > 32 ? 2 : 1;

        for (let index = 0; index < sparkleBursts; index++) {
            if (!force && Math.random() > star.sparkleChance) {
                continue;
            }

            const angle = this.randomBetween(0, Math.PI * 2);
            const spread = this.randomBetween(star.radius * 0.2, star.radius * 0.72);
            const burstX = star.x + Math.cos(angle) * spread;
            const burstY = star.y - this.randomBetween(0, star.radius * 0.35) + (Math.sin(angle) * spread * 0.45);
            const burstRadius = this.randomBetween(star.radius * 0.18, star.radius * 0.42);
            const burstIntensity = star.intensity * this.randomBetween(0.42, 0.76);

            this.stampExcitement(burstX, burstY, burstRadius, burstIntensity);
        }

        if (!force && Math.random() < star.sparkleChance * 0.55) {
            const tailOffset = this.randomBetween(star.radius * 0.5, star.radius * 1.9);
            const tailX = star.x + this.randomBetween(-star.radius * 0.65, star.radius * 0.65);
            const tailY = star.y - tailOffset;
            const tailRadius = this.randomBetween(star.radius * 0.14, star.radius * 0.32);
            const tailIntensity = star.intensity * this.randomBetween(0.32, 0.56);

            this.stampExcitement(tailX, tailY, tailRadius, tailIntensity);
        }
    }

    decayExcitement() {
        for (const [key, excitement] of this.excitementMap.entries()) {
            const newExcitement = excitement * this.excitementDecay;
            if (newExcitement < 0.01) {
                this.excitementMap.delete(key);
            } else {
                this.excitementMap.set(key, newExcitement);
            }
        }
    }

    update(deltaTime) {
        if (!this.isInitialized) return;

        if (!this.config.enabled) {
            this.clear();
            return;
        }

        this.decayExcitement();

        this.activeStars = this.activeStars.filter((star) => {
            star.previousX = star.x;
            star.previousY = star.y;
            star.age += deltaTime;
            star.y += star.speed * deltaTime;

            this.stampTrail(star);

            return star.y <= this.viewportHeight + star.radius * 2.5;
        });

        this.spawnAccumulator += this.config.spawnRate * deltaTime;

        while (this.spawnAccumulator >= 1) {
            this.spawnAccumulator -= 1;

            if (this.activeStars.length >= this.config.maxStars) {
                break;
            }

            const star = this.createStar(false);
            if (!star) {
                break;
            }

            this.activeStars.push(star);
            this.stampCurrentStar(star, true);
        }
    }

    getExcitementLevel(x, y) {
        const key = `${x},${y}`;
        return this.excitementMap.get(key) || 0;
    }

    getChaosMultiplier(x, y) {
        const excitement = this.getExcitementLevel(x, y);
        return 1 + (excitement * (this.maxChaosMultiplier - 1));
    }

    clear() {
        this.activeStars.length = 0;
        this.excitementMap.clear();
        this.spawnAccumulator = 0;
    }

    dispose() {
        if (typeof this.prefersReducedMotionQuery.removeEventListener === 'function') {
            this.prefersReducedMotionQuery.removeEventListener(
                'change',
                this.boundMotionPreferenceChange
            );
        } else if (typeof this.prefersReducedMotionQuery.removeListener === 'function') {
            this.prefersReducedMotionQuery.removeListener(this.boundMotionPreferenceChange);
        }

        this.clear();
    }
}
