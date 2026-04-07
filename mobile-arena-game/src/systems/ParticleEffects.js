/**
 * ParticleEffects.js
 * Visual effect functions for game feel using only Phaser primitives (circles, rectangles, text) and tweens.
 * Every effect auto-cleans up after completion. No external assets required.
 */

/**
 * Burst of 8-12 particles outward, fading and scaling down.
 */
export function deathExplosion(scene, x, y, color = 0xff4444) {
    const count = Phaser.Math.Between(8, 12);
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Phaser.Math.FloatBetween(-0.3, 0.3);
        const speed = Phaser.Math.FloatBetween(60, 140);
        const size = Phaser.Math.Between(3, 6);
        const particle = scene.add.circle(x, y, size, color).setDepth(100);

        scene.tweens.add({
            targets: particle,
            x: x + Math.cos(angle) * speed,
            y: y + Math.sin(angle) * speed,
            alpha: 0,
            scale: 0,
            duration: Phaser.Math.Between(400, 700),
            ease: 'Power2',
            onComplete: () => particle.destroy()
        });
    }
}

/**
 * 3-4 small white sparks at hit position with quick fade.
 */
export function hitSpark(scene, x, y, color = 0xffffff) {
    const count = Phaser.Math.Between(3, 4);
    for (let i = 0; i < count; i++) {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const dist = Phaser.Math.FloatBetween(8, 20);
        const spark = scene.add.circle(x, y, 2, color).setDepth(100);

        scene.tweens.add({
            targets: spark,
            x: x + Math.cos(angle) * dist,
            y: y + Math.sin(angle) * dist,
            alpha: 0,
            scale: 0.2,
            duration: Phaser.Math.Between(150, 250),
            ease: 'Power1',
            onComplete: () => spark.destroy()
        });
    }
}

/**
 * Small '+' text floats up and fades. Color based on loot type.
 */
export function lootPickupEffect(scene, x, y, type) {
    const colorMap = {
        credit: '#ffd700',
        scrap: '#c0c0c0',
        health: '#44ff44',
        ammo: '#ff8800'
    };
    const textColor = colorMap[type] || '#ffffff';

    const label = scene.add.text(x, y, '+', {
        fontSize: '18px',
        fontFamily: 'monospace',
        color: textColor,
        fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(110);

    scene.tweens.add({
        targets: label,
        y: y - 30,
        alpha: 0,
        duration: 600,
        ease: 'Power1',
        onComplete: () => label.destroy()
    });
}

/**
 * Larger spark burst plus "CRIT!" text that scales up and fades.
 */
export function criticalHitEffect(scene, x, y) {
    // Spark burst
    const sparkCount = Phaser.Math.Between(6, 8);
    for (let i = 0; i < sparkCount; i++) {
        const angle = (Math.PI * 2 * i) / sparkCount;
        const dist = Phaser.Math.FloatBetween(15, 35);
        const spark = scene.add.circle(x, y, 3, 0xffff00).setDepth(100);

        scene.tweens.add({
            targets: spark,
            x: x + Math.cos(angle) * dist,
            y: y + Math.sin(angle) * dist,
            alpha: 0,
            scale: 0.3,
            duration: 300,
            ease: 'Power2',
            onComplete: () => spark.destroy()
        });
    }

    // CRIT! text
    const critText = scene.add.text(x, y - 10, 'CRIT!', {
        fontSize: '14px',
        fontFamily: 'monospace',
        color: '#ffff00',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2
    }).setOrigin(0.5).setDepth(120).setScale(0.5);

    scene.tweens.add({
        targets: critText,
        y: y - 40,
        scale: 1.3,
        alpha: 0,
        duration: 700,
        ease: 'Power2',
        onComplete: () => critText.destroy()
    });
}

/**
 * Ring of particles expanding outward plus golden glow.
 */
export function levelUpEffect(scene, x, y) {
    // Golden glow
    const glow = scene.add.circle(x, y, 10, 0xffd700, 0.6).setDepth(95);
    scene.tweens.add({
        targets: glow,
        scale: 4,
        alpha: 0,
        duration: 800,
        ease: 'Power2',
        onComplete: () => glow.destroy()
    });

    // Ring of particles
    const ringCount = 12;
    for (let i = 0; i < ringCount; i++) {
        const angle = (Math.PI * 2 * i) / ringCount;
        const particle = scene.add.circle(x, y, 3, 0xffd700).setDepth(100);

        scene.tweens.add({
            targets: particle,
            x: x + Math.cos(angle) * 60,
            y: y + Math.sin(angle) * 60,
            alpha: 0,
            scale: 0,
            duration: 700,
            ease: 'Power2',
            delay: 100,
            onComplete: () => particle.destroy()
        });
    }
}

/**
 * Floating damage number. White normally, yellow and bigger for crits. Floats up and fades.
 */
export function damageNumber(scene, x, y, amount, isCrit = false) {
    const text = scene.add.text(x, y, `${amount}`, {
        fontSize: isCrit ? '20px' : '14px',
        fontFamily: 'monospace',
        color: isCrit ? '#ffff00' : '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: isCrit ? 3 : 2
    }).setOrigin(0.5).setDepth(115);

    if (isCrit) {
        text.setScale(0.6);
    }

    const offsetX = Phaser.Math.Between(-10, 10);

    scene.tweens.add({
        targets: text,
        x: x + offsetX,
        y: y - 35,
        alpha: 0,
        scale: isCrit ? 1.2 : 0.8,
        duration: isCrit ? 800 : 600,
        ease: 'Power1',
        onComplete: () => text.destroy()
    });
}

/**
 * Green '+' symbols floating up.
 */
export function healEffect(scene, x, y) {
    const count = Phaser.Math.Between(3, 5);
    for (let i = 0; i < count; i++) {
        const offsetX = Phaser.Math.Between(-12, 12);
        const delay = i * 80;

        const plus = scene.add.text(x + offsetX, y, '+', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#44ff44',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(110).setAlpha(0);

        scene.tweens.add({
            targets: plus,
            y: y - Phaser.Math.Between(25, 45),
            alpha: { from: 1, to: 0 },
            duration: 600,
            delay,
            ease: 'Power1',
            onComplete: () => plus.destroy()
        });
    }
}

/**
 * Blue ring pulse expanding outward.
 */
export function shieldActivateEffect(scene, x, y) {
    const ring = scene.add.circle(x, y, 8, 0x4488ff, 0).setDepth(95);
    ring.setStrokeStyle(2, 0x4488ff, 1);

    scene.tweens.add({
        targets: ring,
        scale: 4,
        duration: 500,
        ease: 'Power2',
        onUpdate: (tween) => {
            const progress = tween.progress;
            ring.setStrokeStyle(2 * (1 - progress), 0x4488ff, 1 - progress);
        },
        onComplete: () => ring.destroy()
    });

    // Second ring with delay for a pulse feel
    const ring2 = scene.add.circle(x, y, 8, 0x4488ff, 0).setDepth(95);
    ring2.setStrokeStyle(2, 0x66aaff, 1);

    scene.tweens.add({
        targets: ring2,
        scale: 3,
        delay: 100,
        duration: 400,
        ease: 'Power2',
        onUpdate: (tween) => {
            const progress = tween.progress;
            ring2.setStrokeStyle(2 * (1 - progress), 0x66aaff, 1 - progress);
        },
        onComplete: () => ring2.destroy()
    });
}

/**
 * Afterimage circle that fades quickly for dash trails.
 */
export function dashTrailEffect(scene, x, y) {
    const afterimage = scene.add.circle(x, y, 10, 0xaaaaff, 0.5).setDepth(90);

    scene.tweens.add({
        targets: afterimage,
        alpha: 0,
        scale: 0.5,
        duration: 200,
        ease: 'Power1',
        onComplete: () => afterimage.destroy()
    });
}

/**
 * Purple sparkles converging to center.
 */
export function portalAppearEffect(scene, x, y) {
    const count = 14;
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const radius = Phaser.Math.FloatBetween(50, 80);
        const startX = x + Math.cos(angle) * radius;
        const startY = y + Math.sin(angle) * radius;
        const size = Phaser.Math.Between(2, 4);
        const sparkle = scene.add.circle(startX, startY, size, 0xaa44ff).setDepth(100).setAlpha(0);

        scene.tweens.add({
            targets: sparkle,
            x,
            y,
            alpha: { from: 1, to: 0 },
            scale: 0,
            duration: Phaser.Math.Between(500, 900),
            delay: Phaser.Math.Between(0, 300),
            ease: 'Power2',
            onComplete: () => sparkle.destroy()
        });
    }

    // Central flash when sparkles converge
    const flash = scene.add.circle(x, y, 6, 0xcc66ff, 0).setDepth(101);
    scene.tweens.add({
        targets: flash,
        alpha: { from: 0, to: 0.8 },
        scale: 2,
        duration: 400,
        delay: 500,
        ease: 'Sine.easeIn',
        yoyo: true,
        onComplete: () => flash.destroy()
    });
}
