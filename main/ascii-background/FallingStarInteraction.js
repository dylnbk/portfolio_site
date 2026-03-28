/**
 * Falling Star Interaction
 * Drives cursor-like comet trails automatically across the background.
 */
export class FallingStarInteraction {
    constructor(asciiGrid, colorManager, performanceMode = 'high') {
        this.asciiGrid = asciiGrid;
        this.colorManager = colorManager;
        this.performanceMode = performanceMode;

        this.gridDimensions = null;
        this.cellSize = 10;
        this.viewportWidth = window.innerWidth;
        this.viewportHeight = window.innerHeight;

        this.excitementMap = new Map();
        this.burstCells = new Map();
        this.activeStars = [];
        this.activeBursts = [];
        this.activeBurstParticles = [];

        this.excitementDecay = 0.955;
        this.maxExcitement = 1.4;
        this.maxChaosMultiplier = 8;
        this.spawnAccumulator = 0;
        this.isInitialized = false;

        this.burstCharacters = ['x', '*', '+', 'o', '%', '@', '.', ':'];

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
                    maxLongTailBoost: 1.55,
                    collisionRadiusMultiplier: 1.05,
                    minBurstDuration: 1.2,
                    maxBurstDuration: 1.55,
                    minBurstRadiusMultiplier: 2.4,
                    maxBurstRadiusMultiplier: 3.4,
                    minWaveThicknessMultiplier: 0.45,
                    maxWaveThicknessMultiplier: 0.8,
                    minBurstIntensityMultiplier: 0.78,
                    maxBurstIntensityMultiplier: 0.96,
                    minBurstChaos: 2.6,
                    maxBurstChaos: 4.2,
                    minBurstTailDuration: 0.55,
                    maxBurstTailDuration: 0.85,
                    minDebrisCount: 10,
                    maxDebrisCount: 16,
                    minDebrisDuration: 1.8,
                    maxDebrisDuration: 2.45,
                    minDebrisSpeed: 52,
                    maxDebrisSpeed: 105,
                    minDebrisRadiusMultiplier: 0.18,
                    maxDebrisRadiusMultiplier: 0.34,
                    minDebrisGravity: 68,
                    maxDebrisGravity: 108,
                    minDebrisFallDelay: 0.2,
                    maxDebrisFallDelay: 0.36,
                    minDebrisDriftAmplitude: 8,
                    maxDebrisDriftAmplitude: 18,
                    minDebrisDriftSpeed: 2.1,
                    maxDebrisDriftSpeed: 4,
                    minDebrisDrag: 0.94,
                    maxDebrisDrag: 0.97
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
                    maxLongTailBoost: 1.75,
                    collisionRadiusMultiplier: 1.1,
                    minBurstDuration: 1.45,
                    maxBurstDuration: 1.95,
                    minBurstRadiusMultiplier: 2.8,
                    maxBurstRadiusMultiplier: 3.9,
                    minWaveThicknessMultiplier: 0.55,
                    maxWaveThicknessMultiplier: 1,
                    minBurstIntensityMultiplier: 0.84,
                    maxBurstIntensityMultiplier: 1.04,
                    minBurstChaos: 3.2,
                    maxBurstChaos: 5.4,
                    minBurstTailDuration: 0.72,
                    maxBurstTailDuration: 1.05,
                    minDebrisCount: 14,
                    maxDebrisCount: 22,
                    minDebrisDuration: 2.2,
                    maxDebrisDuration: 3.05,
                    minDebrisSpeed: 64,
                    maxDebrisSpeed: 122,
                    minDebrisRadiusMultiplier: 0.2,
                    maxDebrisRadiusMultiplier: 0.4,
                    minDebrisGravity: 82,
                    maxDebrisGravity: 128,
                    minDebrisFallDelay: 0.24,
                    maxDebrisFallDelay: 0.42,
                    minDebrisDriftAmplitude: 10,
                    maxDebrisDriftAmplitude: 24,
                    minDebrisDriftSpeed: 2.4,
                    maxDebrisDriftSpeed: 4.5,
                    minDebrisDrag: 0.945,
                    maxDebrisDrag: 0.975
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
                    maxLongTailBoost: 1.95,
                    collisionRadiusMultiplier: 1.16,
                    minBurstDuration: 1.7,
                    maxBurstDuration: 2.3,
                    minBurstRadiusMultiplier: 3.1,
                    maxBurstRadiusMultiplier: 4.4,
                    minWaveThicknessMultiplier: 0.62,
                    maxWaveThicknessMultiplier: 1.15,
                    minBurstIntensityMultiplier: 0.88,
                    maxBurstIntensityMultiplier: 1.12,
                    minBurstChaos: 3.8,
                    maxBurstChaos: 6.2,
                    minBurstTailDuration: 0.9,
                    maxBurstTailDuration: 1.3,
                    minDebrisCount: 18,
                    maxDebrisCount: 28,
                    minDebrisDuration: 2.55,
                    maxDebrisDuration: 3.55,
                    minDebrisSpeed: 78,
                    maxDebrisSpeed: 145,
                    minDebrisRadiusMultiplier: 0.22,
                    maxDebrisRadiusMultiplier: 0.46,
                    minDebrisGravity: 94,
                    maxDebrisGravity: 146,
                    minDebrisFallDelay: 0.28,
                    maxDebrisFallDelay: 0.48,
                    minDebrisDriftAmplitude: 12,
                    maxDebrisDriftAmplitude: 30,
                    minDebrisDriftSpeed: 2.6,
                    maxDebrisDriftSpeed: 5.1,
                    minDebrisDrag: 0.95,
                    maxDebrisDrag: 0.98
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

    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    sampleNoise(x, y, seed) {
        const value = Math.sin((x * 12.9898) + (y * 78.233) + (seed * 37.719)) * 43758.5453;
        return value - Math.floor(value);
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
            const candidate = this.randomBetween(
                padding,
                Math.max(padding + 1, this.viewportWidth - padding)
            );
            const isFarEnough = this.activeStars.every((star) => {
                const spacing = Math.max(this.config.spawnSpacing, (star.radius + radius) * 1.35);
                return Math.abs(star.x - candidate) >= spacing;
            });

            if (isFarEnough) {
                return candidate;
            }
        }

        if (this.activeStars.length < this.config.maxStars) {
            return this.randomBetween(
                padding,
                Math.max(padding + 1, this.viewportWidth - padding)
            );
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
            const burstY = star.y - this.randomBetween(0, star.radius * 0.35)
                + (Math.sin(angle) * spread * 0.45);
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

    checkCollision(star, mousePosition) {
        if (!mousePosition) {
            return false;
        }

        const dx = mousePosition.x - star.x;
        const dy = mousePosition.y - star.y;
        const collisionRadius = star.radius * this.config.collisionRadiusMultiplier;
        return (dx * dx) + (dy * dy) <= collisionRadius * collisionRadius;
    }

    triggerCollisionBurst(star, mousePosition) {
        const collisionX = mousePosition
            ? this.lerp(star.x, mousePosition.x, 0.35)
            : star.x;
        const collisionY = mousePosition
            ? this.lerp(star.y, mousePosition.y, 0.35)
            : star.y;

        this.activeBursts.push({
            x: collisionX,
            y: collisionY,
            age: 0,
            duration: this.randomBetween(this.config.minBurstDuration, this.config.maxBurstDuration),
            startRadius: star.radius * 0.3,
            maxRadius: star.radius * this.randomBetween(
                this.config.minBurstRadiusMultiplier,
                this.config.maxBurstRadiusMultiplier
            ),
            waveThickness: star.radius * this.randomBetween(
                this.config.minWaveThicknessMultiplier,
                this.config.maxWaveThicknessMultiplier
            ),
            intensity: star.intensity * this.randomBetween(
                this.config.minBurstIntensityMultiplier,
                this.config.maxBurstIntensityMultiplier
            ),
            chaosMultiplier: this.randomBetween(
                this.config.minBurstChaos,
                this.config.maxBurstChaos
            ),
            tailDuration: this.randomBetween(
                this.config.minBurstTailDuration,
                this.config.maxBurstTailDuration
            ),
            phase: this.randomBetween(0, Math.PI * 2),
            anchorX: collisionX,
            anchorY: collisionY,
            ringFragmentsReleased: false
        });

        this.spawnBurstParticles(star, collisionX, collisionY);
    }

    spawnBurstParticles(star, collisionX, collisionY) {
        const particleCount = Math.round(this.randomBetween(
            this.config.minDebrisCount,
            this.config.maxDebrisCount
        ));

        for (let index = 0; index < particleCount; index++) {
            const angle = this.randomBetween(0, Math.PI * 2);
            const speed = this.randomBetween(
                this.config.minDebrisSpeed,
                this.config.maxDebrisSpeed
            ) * (0.85 + (star.radius / this.config.maxRadius) * 0.4);

            this.activeBurstParticles.push({
                x: collisionX,
                y: collisionY,
                vx: Math.cos(angle) * speed,
                vy: (Math.sin(angle) * speed * 0.55)
                    - this.randomBetween(speed * 0.28, speed * 0.5),
                age: 0,
                duration: this.randomBetween(
                    this.config.minDebrisDuration,
                    this.config.maxDebrisDuration
                ),
                gravity: this.randomBetween(
                    this.config.minDebrisGravity,
                    this.config.maxDebrisGravity
                ),
                fallDelay: this.randomBetween(
                    this.config.minDebrisFallDelay,
                    this.config.maxDebrisFallDelay
                ),
                driftAmplitude: this.randomBetween(
                    this.config.minDebrisDriftAmplitude,
                    this.config.maxDebrisDriftAmplitude
                ),
                driftSpeed: this.randomBetween(
                    this.config.minDebrisDriftSpeed,
                    this.config.maxDebrisDriftSpeed
                ),
                drag: this.randomBetween(
                    this.config.minDebrisDrag,
                    this.config.maxDebrisDrag
                ),
                radius: star.radius * this.randomBetween(
                    this.config.minDebrisRadiusMultiplier,
                    this.config.maxDebrisRadiusMultiplier
                ),
                intensity: star.intensity * this.randomBetween(0.34, 0.72),
                chaosMultiplier: this.randomBetween(
                    this.config.minBurstChaos * 0.85,
                    this.config.maxBurstChaos
                ),
                character: this.burstCharacters[
                    Math.floor(Math.random() * this.burstCharacters.length)
                ],
                colorBias: this.randomBetween(0, 1),
                phase: this.randomBetween(0, Math.PI * 2)
            });
        }
    }

    spawnRingHaloParticles(burst, waveRadius, progress) {
        const fragmentCount = Math.max(
            8,
            Math.round(this.lerp(10, 26, this.clamp(waveRadius / Math.max(this.config.maxRadius * 4.2, 1), 0, 1)))
        );

        for (let index = 0; index < fragmentCount; index++) {
            const angle = ((Math.PI * 2) / fragmentCount) * index
                + this.randomBetween(-0.14, 0.14)
                + burst.phase * 0.08;
            const shellX = burst.x + Math.cos(angle) * waveRadius;
            const shellY = burst.y + Math.sin(angle) * waveRadius;
            const outwardSpeed = this.randomBetween(
                this.config.minDebrisSpeed * 0.55,
                this.config.maxDebrisSpeed * 0.78
            );

            this.activeBurstParticles.push({
                x: shellX,
                y: shellY,
                vx: Math.cos(angle) * outwardSpeed * this.randomBetween(0.42, 0.82),
                vy: (Math.sin(angle) * outwardSpeed * 0.36)
                    - this.randomBetween(outwardSpeed * 0.18, outwardSpeed * 0.34),
                age: 0,
                duration: this.randomBetween(
                    this.config.minDebrisDuration * 1.05,
                    this.config.maxDebrisDuration * 1.18
                ),
                gravity: this.randomBetween(
                    this.config.minDebrisGravity * 0.92,
                    this.config.maxDebrisGravity * 1.05
                ),
                fallDelay: this.randomBetween(
                    this.config.minDebrisFallDelay * 0.9,
                    this.config.maxDebrisFallDelay * 1.1
                ),
                driftAmplitude: this.randomBetween(
                    this.config.minDebrisDriftAmplitude * 0.85,
                    this.config.maxDebrisDriftAmplitude * 1.1
                ),
                driftSpeed: this.randomBetween(
                    this.config.minDebrisDriftSpeed,
                    this.config.maxDebrisDriftSpeed
                ),
                drag: this.randomBetween(
                    this.config.minDebrisDrag,
                    this.config.maxDebrisDrag
                ),
                radius: burst.waveThickness * this.randomBetween(0.42, 0.82),
                intensity: burst.intensity * this.randomBetween(0.26, 0.54) * (1 - progress * 0.15),
                chaosMultiplier: this.randomBetween(
                    this.config.minBurstChaos * 0.7,
                    this.config.maxBurstChaos * 0.95
                ),
                character: this.burstCharacters[
                    Math.floor(Math.random() * this.burstCharacters.length)
                ],
                colorBias: this.randomBetween(0.18, 1),
                phase: this.randomBetween(0, Math.PI * 2),
                fadeStart: this.randomBetween(0.58, 0.8)
            });
        }
    }

    pickBurstColor(palette, strength) {
        if (strength > 0.72) {
            return palette[2];
        }

        if (strength > 0.38) {
            return palette[1];
        }

        return palette[0];
    }

    pickBurstCharacter(strength, noise) {
        if (strength > 0.78) {
            return noise > 0.5 ? '@' : '%';
        }

        if (strength > 0.5) {
            return noise > 0.5 ? '*' : '+';
        }

        return noise > 0.5 ? 'x' : 'o';
    }

    storeBurstCell(x, y, state) {
        const key = `${x},${y}`;
        const existingState = this.burstCells.get(key);

        if (!existingState || state.density > existingState.density) {
            this.burstCells.set(key, state);
        }
    }

    stampBurstParticle(particle, palette) {
        const progress = particle.age / particle.duration;
        const fadeStart = Number.isFinite(particle.fadeStart)
            ? particle.fadeStart
            : Math.min(0.72, 0.26 + (particle.fallDelay / particle.duration) * 0.9);
        const fadeProgress = progress <= fadeStart
            ? 0
            : (progress - fadeStart) / (1 - fadeStart);
        const fade = Math.pow(Math.max(0, 1 - fadeProgress), 1.9);

        if (fade <= 0.01) {
            return;
        }

        const radius = Math.max(this.cellSize * 0.7, particle.radius * (0.92 - progress * 0.38));
        const gridX = Math.floor(particle.x / this.cellSize);
        const gridY = Math.floor(particle.y / this.cellSize);
        const influenceGridRadius = Math.ceil(radius / this.cellSize);

        for (let x = Math.max(0, gridX - influenceGridRadius);
             x < Math.min(this.gridDimensions.width, gridX + influenceGridRadius + 1);
             x++) {
            for (let y = Math.max(0, gridY - influenceGridRadius);
                 y < Math.min(this.gridDimensions.height, gridY + influenceGridRadius + 1);
                 y++) {
                const cellScreenX = (x + 0.5) * this.cellSize;
                const cellScreenY = (y + 0.5) * this.cellSize;
                const distance = Math.sqrt(
                    Math.pow(particle.x - cellScreenX, 2) +
                    Math.pow(particle.y - cellScreenY, 2)
                );

                if (distance > radius) {
                    continue;
                }

                const normalizedDistance = distance / radius;
                const distanceFade = Math.pow(1 - normalizedDistance, 1.2);
                const noise = this.sampleNoise(x, y, particle.phase + particle.age * 11.5);
                const sparkle = 0.82 + noise * 0.22;
                const density = this.clamp(
                    particle.intensity * distanceFade * fade * sparkle,
                    0,
                    this.maxExcitement
                );

                if (density <= 0.012) {
                    continue;
                }

                const strength = this.clamp(
                    (distanceFade * 0.8) + (fade * 0.35) + (particle.colorBias * 0.18),
                    0,
                    1
                );
                const preferredCharacter = distanceFade > 0.55 || noise > 0.8
                    ? particle.character
                    : null;

                this.storeBurstCell(x, y, {
                    density,
                    color: this.pickBurstColor(palette, strength),
                    chaosMultiplier: 1 + particle.chaosMultiplier * (0.35 + distanceFade * 0.65),
                    preferredCharacter,
                    threshold: 0.0025
                });
            }
        }
    }

    updateBurstParticles(deltaTime, palette) {
        this.activeBurstParticles = this.activeBurstParticles.filter((particle) => {
            particle.age += deltaTime;

            if (particle.age >= particle.duration) {
                return false;
            }

            const horizontalDamping = Math.pow(particle.drag, deltaTime * 60);
            particle.vx *= horizontalDamping;

            if (particle.age >= particle.fallDelay) {
                const fallProgress = this.clamp(
                    (particle.age - particle.fallDelay) / Math.max(0.0001, particle.duration - particle.fallDelay),
                    0,
                    1
                );
                particle.vy *= Math.pow(0.992, deltaTime * 60);
                particle.vy += particle.gravity * (0.28 + this.easeInOutQuad(fallProgress) * 1.05) * deltaTime;
                particle.vy = Math.max(particle.vy, particle.gravity * 0.12 * fallProgress);
            } else {
                particle.vy *= Math.pow(0.985, deltaTime * 60);
            }

            const drift = Math.sin((particle.age * particle.driftSpeed) + particle.phase)
                * particle.driftAmplitude
                * (0.35 + this.clamp(particle.age / particle.duration, 0, 1) * 0.65);

            particle.x += (particle.vx + drift) * deltaTime;
            particle.y += particle.vy * deltaTime;

            this.stampBurstParticle(particle, palette);

            return particle.y <= this.viewportHeight + particle.radius * 5;
        });
    }

    updateBursts(deltaTime) {
        this.burstCells.clear();
        const palette = this.colorManager?.getThreeJSCursorHoverPalette?.()
            || [0x8080ff, 0x4080ff, 0x00ffff];

        if (this.activeBursts.length === 0 && this.activeBurstParticles.length === 0) {
            return;
        }

        this.activeBursts = this.activeBursts.filter((burst) => {
            burst.age += deltaTime;

            const totalDuration = burst.duration + burst.tailDuration;
            if (burst.age >= totalDuration) {
                return false;
            }
            const activeProgress = this.clamp(burst.age / burst.duration, 0, 1);
            const tailProgress = burst.age <= burst.duration
                ? 0
                : this.clamp((burst.age - burst.duration) / burst.tailDuration, 0, 1);
            const softFadeProgress = this.clamp((activeProgress - 0.52) / 0.48, 0, 1);
            const visibility = (1 - softFadeProgress * 0.55) * Math.pow(1 - tailProgress, 1.65);
            const progress = this.clamp(burst.age / totalDuration, 0, 1);
            burst.x = burst.anchorX;
            burst.y = burst.anchorY;

            const outwardProgress = this.clamp(activeProgress / 0.42, 0, 1);
            const easedProgress = this.easeOutCubic(outwardProgress);
            const waveRadius = this.lerp(burst.startRadius, burst.maxRadius, easedProgress);

            if (!burst.ringFragmentsReleased && activeProgress >= 0.28) {
                this.spawnRingHaloParticles(burst, waveRadius, activeProgress);
                burst.ringFragmentsReleased = true;
            }

            const waveThickness = Math.max(
                this.cellSize * 1.15,
                burst.waveThickness * ((1 - activeProgress * 0.12) + tailProgress * 0.35)
            );
            const innerFlashRadius = Math.max(
                this.cellSize * 1.5,
                burst.startRadius * (2.45 - activeProgress * 1.1)
            );
            const outerReach = waveRadius + waveThickness;
            const minX = Math.max(0, Math.floor((burst.x - outerReach) / this.cellSize));
            const maxX = Math.min(
                this.gridDimensions.width - 1,
                Math.ceil((burst.x + outerReach) / this.cellSize)
            );
            const minY = Math.max(0, Math.floor((burst.y - outerReach) / this.cellSize));
            const maxY = Math.min(
                this.gridDimensions.height - 1,
                Math.ceil((burst.y + outerReach) / this.cellSize)
            );

            for (let x = minX; x <= maxX; x++) {
                for (let y = minY; y <= maxY; y++) {
                    const cellScreenX = (x + 0.5) * this.cellSize;
                    const cellScreenY = (y + 0.5) * this.cellSize;
                    const dx = cellScreenX - burst.x;
                    const dy = cellScreenY - burst.y;
                    const distance = Math.sqrt((dx * dx) + (dy * dy));
                    const ringDelta = Math.abs(distance - waveRadius);
                    const ringStrength = ringDelta <= waveThickness
                        ? 1 - (ringDelta / waveThickness)
                        : 0;
                    const coreStrength = activeProgress < 0.48 && distance < innerFlashRadius
                        ? (1 - (distance / innerFlashRadius)) * (1 - (activeProgress / 0.48))
                        : 0;
                    const afterGlowStrength = activeProgress > 0.2 && distance < waveRadius * 0.72
                        ? visibility * (1 - (distance / Math.max(waveRadius * 0.72, this.cellSize)))
                        : 0;

                    const baseStrength = Math.max(
                        ringStrength * visibility,
                        coreStrength * 0.78 * visibility,
                        afterGlowStrength * 0.46
                    );
                    if (baseStrength <= 0.012) {
                        continue;
                    }

                    const noise = this.sampleNoise(x, y, burst.phase + burst.age * 12);
                    const sparkleStrength = this.clamp(baseStrength + noise * 0.18, 0, 1);
                    const density = this.clamp(
                        burst.intensity
                        * (0.16 + sparkleStrength * 0.95)
                        * visibility
                        * Math.pow(1 - progress, 0.82),
                        0,
                        this.maxExcitement
                    );
                    const chaosMultiplier = 1 + burst.chaosMultiplier
                        * (0.38 + sparkleStrength * 0.62);
                    const preferredCharacter = (ringStrength > 0.55 || noise > 0.82)
                        ? this.pickBurstCharacter(sparkleStrength, noise)
                        : null;

                    this.storeBurstCell(x, y, {
                        density,
                        color: this.pickBurstColor(palette, sparkleStrength),
                        chaosMultiplier,
                        preferredCharacter,
                        threshold: 0.0018
                    });
                }
            }

            return true;
        });

        this.updateBurstParticles(deltaTime, palette);
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

    update(deltaTime, mousePosition = null, mouseActive = false) {
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

            if (mouseActive && this.checkCollision(star, mousePosition)) {
                this.triggerCollisionBurst(star, mousePosition);
                return false;
            }

            this.stampTrail(star);

            return star.y <= this.viewportHeight + star.radius * 2.5;
        });

        this.updateBursts(deltaTime);

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

    getCellState(x, y) {
        const key = `${x},${y}`;
        return this.burstCells.get(key) || null;
    }

    getExcitementLevel(x, y) {
        const key = `${x},${y}`;
        const trailExcitement = this.excitementMap.get(key) || 0;
        const burstDensity = this.burstCells.get(key)?.density || 0;
        return Math.max(trailExcitement, burstDensity);
    }

    getChaosMultiplier(x, y) {
        const key = `${x},${y}`;
        const trailExcitement = Math.min(this.excitementMap.get(key) || 0, 1);
        const trailChaosMultiplier = 1 + (trailExcitement * (this.maxChaosMultiplier - 1));
        const burstChaosMultiplier = this.burstCells.get(key)?.chaosMultiplier || 1;
        return Math.max(trailChaosMultiplier, burstChaosMultiplier);
    }

    clear() {
        this.activeStars.length = 0;
        this.activeBursts.length = 0;
        this.activeBurstParticles.length = 0;
        this.excitementMap.clear();
        this.burstCells.clear();
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
