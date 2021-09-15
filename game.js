document.addEventListener("DOMContentLoaded", () => {

    "use strict";


    kaboom({
        global: true,
        fullscreen: true,    //ocupa toda la pantalla
        scale: 2,
        debug: true,
        clearColor: [0, 0, 0, 1]    //le da un contexto al canvas
        //[r, g, b, alpha]
    })

    //Identificadores de velocidad

    const MOVE_SPEED = 120;
    const JUMP_FORCE = 390;
    const BIG_JUMP_FORCE = 500;
    let CURRENT_JUMP_FORCE = JUMP_FORCE;
    const FALL_DEATH = 400;
    const ENEMY_SPEED = 20;
    const MUSHROOM_SPEED = 80;

    let isJumping = true;

    //Lógica del juego
    loadRoot('https://i.imgur.com/'); // === loadRoot('./assets/');
    loadSprite('coin', 'wbKxhcd.png');
    loadSprite('evil-shroom', 'KPO3fR9.png');
    loadSprite('brick', 'pogC9x5.png');
    loadSprite('block', 'M6rwarW.png');
    loadSprite('mario', 'Wb1qfhK.png');
    loadSprite('mushroom', '0wMd92p.png');
    loadSprite('surprise', 'gesQ1KP.png');
    loadSprite('unboxed', 'bdrLpi6.png');
    loadSprite('pipe-top-left', 'ReTPiWY.png');
    loadSprite('pipe-top-right', 'hj2GK4n.png');
    loadSprite('pipe-bottom-left', 'c1cYSbt.png');
    loadSprite('pipe-bottom-right', 'nqQ79eI.png');

    loadSprite('blue-block', 'fVscIbn.png');
    loadSprite('blue-brick', '3e5YRQd.png');
    loadSprite('blue-steel', 'gqVoI2b.png');
    loadSprite('blue-evil-shroom', 'SvV4ueD.png');
    loadSprite('blue-surprise', 'RMqCc1G.png');

    scene('game', ({ level, score }) => {
        layers(['bg', 'obj', 'ui'], 'obj')  //bg== background

        const maps = [
            [             //map level 1
                '                                  ',
                '                                  ',
                '                                  ',
                '                                  ',
                '                                  ',
                '                                  ',
                '                                  ',
                '                                  ',
                '                                  ',
                '                                  ',
                '      %  =*=%=                    ',
                '                    -+            ',
                '              ^  ^  ()            ',
                '======================   ========'
            ],
            [            //map level 2
                '£                                       £',
                '£                                       £',
                '£                                       £',
                '£                                       £',
                '£                                       £',
                '£        @@@@@@              x x        £',
                '£                          x x x        £',
                '£                        x x x x  x   -+£',
                '£               z   z  x x x x x  x   ()£',
                '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!',
            ]
        ]

        const levelCfg = {
            width: 20,
            height: 20,
            '=': [sprite('block'), solid()],        //si encuentra un =, pone un bloque de piso de imagen
            '$': [sprite('coin'), 'coin'],    //si encuentra un $, va a salir una moneda o una sorpresa.
            '%': [sprite('surprise'), solid(), 'coin-surprise'],    //si encuentra un %, va a salir una moneda de la caja de sorpresa.
            '*': [sprite('surprise'), solid(), 'mushroom-surprise'],    //si encuentra un *, va a salir un hongo.
            '}': [sprite('unboxed'), solid()],    //si encuentra un }, no va a encontrar caja
            '(': [sprite('pipe-bottom-left'), solid(), scale(0.5)],    //si encuentra un (, muestra el lado izquierdo de la tubería
            ')': [sprite('pipe-bottom-right'), solid(), scale(0.5)],    //si encuentra un ), muestra el lado derecho de la tubería
            '+': [sprite('pipe-top-right'), solid(), scale(0.5), 'pipe'],    //si encuentra un +, muestra el lado superior derecho de la tubería y funciona como tubería
            '-': [sprite('pipe-top-left'), solid(), scale(0.5), 'pipe'],    //si encuentra un -, muestra el lado superior izquierdo de la tubería y funciona como tubería
            '^': [sprite('evil-shroom'), solid(), 'dangerous'],    //si encuentra un ^, muestra el hongo malo
            '#': [sprite('mushroom'), solid(), 'mushroom', body()], //si encuentra un #, muestra el hongo bueno
            '!': [sprite('blue-block'), solid(), scale(0.5)],   //si encuentra un !, muestra un bloque azul
            '£': [sprite('blue-brick'), solid(), scale(0.5)],   //si encuentra un £, muestra un bloque azul
            'z': [sprite('blue-evil-shroom'), solid(), scale(0.5), 'dangerous'],
            '@': [sprite('blue-surprise'), solid(), scale(0.5), 'coin-surprise'],
            'x': [sprite('blue-steel'), solid(), scale(0.5)],

        }


        //pinta el mapa y termina la función de escena
        const gameLevel = addLevel(maps[level], levelCfg);

        //Puntuación
        const scoreLabel = add([
            text(score),
            pos(30, 6),
            layer('ui'),
            { value: score }
        ])

        add([
            text('level ' + parseInt(level + 1)),
            pos(40, 6)
        ]);

        //Personaje: Mario
        const player = add([
            sprite('mario'),
            solid(),
            pos(30, 0),     //hace el efecto que caiga al inicio y respete el body
            origin('bot'),
            body(),
            big()
        ]);


        //ACCIONES

        //Hacerlo grande
        function big() {
            let timer = 0;
            let isBig = false;
            return {
                update() {   //Actualización dependiendo del timer
                    if (isBig) {
                        CURRENT_JUMP_FORCE = BIG_JUMP_FORCE     //Si Mario es grande, puede saltar mucho más
                        timer -= dt();  //Cronómetro
                        if (timer <= 0) { //Cuando se llega a 0 con el tiempo, lo vuelve pequeño
                            this.smallify();
                        }
                    }
                },
                isBig() {    //Cambia la variable cuando es grande
                    return isBig
                },
                smallify() { //Se resetean los valores a normales
                    this.scale = vec2(1);
                    CURRENT_JUMP_FORCE = JUMP_FORCE;
                    timer = 0;
                    isBig = false;
                },
                biggify(time) {
                    this.scale = vec2(2);
                    timer = time;
                    isBig = true;
                }
            }
        }

        //Desaparece el hongo
        player.collides('mushroom', (m) => {
            destroy(m);
            player.biggify(6);
        })

        //Agarrar moneda
        player.collides('coin', (c) => {
            destroy(c);
            scoreLabel.value++; //Actualiza el score
            scoreLabel.text = scoreLabel.value;
        })

        //Cuando salga el hongo
        action('mushroom', m => {
            m.move(MUSHROOM_SPEED, 0);
        })


        //Colisiones con un hongo malo
        player.collides('dangerous', d => {
            if (isJumping) {    //Si se salta, se destruye al hongo malo
                destroy(d)
            } else {    //si lo toca, se genera la escena de muerte (perder el juego).
                go('lose', { score: scoreLabel.value });
            }
        })

        //Se cae al vacío
        player.action(() => {
            camPos(player.pos);  //Encuentra la posición actual
            if (player.pos.y >= FALL_DEATH) {   //Si es mayor a la escena de muerte (perder el juego)
                go('lose', { score: scoreLabel.value })
            }
        })


        //Lo que sale de la caja sorpresa (hongo u moneda)
        player.on('headbump', (obj) => {
            //Si es una moneda
            if (obj.is('coin-surprise')) {
                gameLevel.spawn('$', obj.gridPos.sub(0, 1));
                destroy(obj)    //Destruye la caja
                gameLevel.spawn('}', obj.gridPos.sub(0, 0));  //Para que aparezca en el lugar de la caja
            }
            //Si es un hongo
            if (obj.is('mushroom-surprise')) {
                gameLevel.spawn('#', obj.gridPos.sub(0, 1)); //Queremos que salga el hongo
                destroy(obj)    //Destruye la caja
                gameLevel.spawn('}', obj.gridPos.sub(0, 0));  //Para que aparezca en el lugar de la caja
            }
        });

        //No destruimos al hongo
        player.action(() => {
            if (player.grounded()) {
                isJumping = false
            }
        })

        //Entrar a una tubería
        player.collides('pipe', () => {
            keyPress('down', () => {
                go('game', {
                    level: (level + 1) % maps.length,
                    score: scoreLabel.value
                });
            });
        });

        //Movimiento del hongo malo
        action('dangerous', (d) => {
            d.move(-ENEMY_SPEED, 0);
        })

        //Movimiento izquierdo de avance
        keyDown('left', () => {
            player.move(-MOVE_SPEED, 0)  //Parámetros de velocidad
        });

        //Movimiento a la derecha de avance
        keyDown('right', () => {
            player.move(MOVE_SPEED, 0)  //Parámetros de velocidad
        });

        //Movimiento salto
        keyPress('space', () => {
            if (player.grounded()) {
                isJumping = true;
                player.jump(CURRENT_JUMP_FORCE);    //Fuerza de salto, cambia si Mario es pequeño o grande
            }
        });
    })

    scene('lose', ({ score }) => { //recibe el score logrado 
        add([
            text(score, 32),    //muestra el score
            origin('center'),
            pos(width() / 2, height() / 2)
        ])
    });

    start('game', { level: 0, score: 0 });
});