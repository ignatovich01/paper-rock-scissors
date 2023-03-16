const crypto = require('crypto');
const readline = require('readline');
const moves = process.argv.slice(2);

class SecretKey {
  generateRandomkey() {
    return crypto.randomBytes(32).toString('hex');
  }
}

class Hmac {
  constructor(key, turn) {
    this.key = key;
    this.turn = turn;
  }
  createHmac() {
    return crypto
      .createHmac('sha3-256', this.key)
      .update(this.turn)
      .digest('hex');
  }
}

class Game {
  constructor() {
    this.moves = [...moves];
  }
  getResult(userTurn, computerTurn) {
    const diff = (computerTurn - userTurn + this.moves.length) % moves.length;
    if (diff == 0) {
      return 'Draw';
    } else if (diff <= moves.length / 2) {
      return 'You win';
    } else return 'You lose';
  }
}

class Table {
  constructor(game) {
    this.game = game;
  }
  showTable(moves) {
    const matrix = [];
    for (let i = 0; i < moves.length; i++) {
      const row = {};
      for (let j = 0; j < moves.length; j++) {
        row[moves[j]] = this.game.getResult(i, j);
      }
      matrix.push(row);
    }
    const newMatrix = matrix.map((obj, index) => ({
      ' ': moves[index],
      ...obj,
    }));
    console.table(newMatrix);
  }
}

////////
const sameValidator = {
  isValid: (moves) => moves.length === new Set(moves).size,
  message: 'у вас есть повторения',
};
const lengthValidator = {
  isValid: (moves) => moves.length >= 3,
  message: 'слишком мало параметров',
};
const oddValidator = {
  isValid: (moves) => moves.length % 2 !== 0,
  message: 'должно быть нечетное число параметров',
};
const validators = [sameValidator, lengthValidator, oddValidator];
function validateInput(moves) {
  validators.forEach(({ isValid, message }) => {
    if (!isValid(moves)) throw new Error(message);
  });
}
///

function makeTurn(moves) {
  const randomIndex = Math.floor(Math.random() * moves.length);
  return moves[randomIndex];
}

function startGame() {
  validateInput(moves);

  let secretKey = new SecretKey();
  let key = secretKey.generateRandomkey();
  let turn = makeTurn(moves);
  const hmac = new Hmac(key, turn);
  const HMAChash = hmac.createHmac();
  const game = new Game();

  console.log(`HMAC:${HMAChash}`);
  console.log('Avaliable moves:');

  moves.forEach((item, index) => {
    console.log(index + 1 + ' - ' + item);
  });
  console.log('0 - exit\n? - help ');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  askMore();

  function askMore() {
    rl.question('Enter your move:', (number) => {
      const yourMove = moves[+(number - 1)];

      if (number == 0) {
        console.log('You are leaving game,goodbye');
        rl.close();
      } else if (number === '?') {
        const table = new Table(game);
        table.showTable(moves);
        askMore();
      } else if (!yourMove) {
        console.log('Must be correct value');
        askMore();
      } else {
        console.log(`Your move:${yourMove}`);
        console.log(`Computer move:${turn}`);
        console.log(game.getResult(+number, moves.indexOf(turn) + 1));
        console.log(`HMAC key:${key}`);
        rl.close();
      }
    });
  }
}

try {
  startGame();
} catch (err) {
  console.log(err + '' + err.message);
}
