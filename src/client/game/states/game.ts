/// <reference path="../../../../type-declarations/index.d.ts" />
import * as Phaser from 'phaser';

import { setResponsiveWidth, polarity } from '../utils';
import { getGameState } from '../../store';

const enum TILE { WIDTH = 16, HEIGHT = 16 };

interface Location { x: number; y: number; };

class Link extends Phaser.Sprite {
  gridPosition: Phaser.Point;

  constructor(game: Phaser.Game, {x, y}: Location) {
    super(game, x * TILE.WIDTH, y * TILE.HEIGHT, 'link', 0);
    this.gridPosition = new Phaser.Point(x, y);
  }

  create() {
    this.animations.add('down',  [0, 4], 10, true);
    this.animations.add('left',  [1, 5], 10, true);
    this.animations.add('up',    [2, 6], 10, true);
    this.animations.add('right', [3, 7], 10, true);
  }

  move(loc: Location) {
    const dir = this.determineDirection(loc);

    if (dir) {
      this.animations.play(dir);
    } else {
      this.animations.stop();
    }
    this.travelTo(loc);
  }

  determineDirection({x, y}: Location): string {
    const [xPolarity, yPolarity] = [
      polarity(x - this.gridPosition.x),
      polarity(y - this.gridPosition.y),
    ];

    if (xPolarity ===  1) { return 'right'; }
    if (xPolarity === -1) { return  'left'; }
    if (yPolarity ===  1) { return  'down'; }
    if (yPolarity === -1) { return    'up'; }
    return null;
  }

  travelTo({x, y}: Location) {
    this.gridPosition.x = x * TILE.WIDTH;
    this.gridPosition.y = y * TILE.HEIGHT;
    this.game.add.tween(this).to({
        x: this.gridPosition.x,
        y: this.gridPosition.y
      },
      250, Phaser.Easing.Quadratic.Out, true
    );
  }

  update() {}
}

class Enemy extends Phaser.Sprite {
  constructor(game: Phaser.Game, {x, y}: Location) {
    super(game, x, y, 'octorock');
  }
}

export class GameState extends Phaser.State {
  link: Link;
  enemies: Phaser.Group;
  faries: Phaser.Group;
  hearts: Phaser.Group;
  triforce: Phaser.Group;
  tilemap: Phaser.Tilemap;
  layer: Phaser.TilemapLayer;
  camera: Phaser.Camera;
  dragPoint: Phaser.Point;

  create () {
    const gameState = getGameState();

    this.game.physics.startSystem(
      Phaser.Physics.ARCADE
    );

    this.tilemap = this.game.add.tilemap(
      'zeldamap', TILE.WIDTH, TILE.HEIGHT
    );
    this.tilemap.addTilesetImage(
      'zeldatiles', 'zeldatiles',
      TILE.WIDTH, TILE.HEIGHT,
      1, 1
    );
    this.layer = this.tilemap.createLayer(0);

    this.layer.resizeWorld();

    this.enemies = this.game.add.group();
    this.faries = this.game.add.group();
    this.hearts = this.game.add.group();
    this.triforce = this.game.add.group();

    this.placeEntities(gameState);

    this.game.add.existing(this.link);

    this.camera = this.game.camera;
    this.camera.follow(
      this.link, Phaser.Camera.FOLLOW_LOCKON, 0.1, 0.1
    );

    // Start polling for character events
    this.game.time.events.loop(
      (Phaser.Timer.SECOND / 10),
      () => {
        let {charState} = getGameState();
        this.link.move(charState.charLocation);
      }
    );
  }

  placeEntities({charState, gameBoard}: any) {
    this.link = new Link(this.game, charState.charLocation);

    const place = (col, row, sprite) =>
      this.enemies.create(col * TILE.WIDTH, row * TILE.HEIGHT, sprite);

    gameBoard.forEach((row, rowIndex) => {
      row.forEach((cell, columnIndex) => {
        if (cell.d !== undefined) { /** Nothing yet */ }
        if (cell.e !== undefined) { place(columnIndex, rowIndex, 'octorock'); }
        if (cell.f !== undefined) { place(columnIndex, rowIndex, 'fairy'); }
        if (cell.h !== undefined) { place(columnIndex, rowIndex, 'heart'); }
        if (cell.i !== undefined) { place(columnIndex, rowIndex, 'triforce'); }
      });
    });
  }

  update() {
    this.game.input.onTap.add((mouse, doubleClick) => {
      if (doubleClick) {
        this.camera.follow(this.link, Phaser.Camera.FOLLOW_LOCKON, 0.1, 0.1);
      } else {
        this.game.camera.unfollow();
      }
    });

    const input = this.game.input;

    if (input.activePointer.isDown) {
      if (this.dragPoint) {
        this.camera.x += this.dragPoint.x - input.activePointer.position.x;
        this.camera.y += this.dragPoint.y - input.activePointer.position.y;
      }
      this.dragPoint = input.activePointer.position.clone();
    } else {
      this.dragPoint = null;
    }
  }

  render() {
    // this.game.debug.cameraInfo(this.game.camera, 32, 32);
    // this.game.debug.spriteInfo(this.link, 32, 32);
  }
}