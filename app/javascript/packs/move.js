// 駒の所有者を判別
function getOwner(piece) {
  if (!piece) return null;
  if (typeof piece === 'string') {
    // 文字列なら先手後手判別
    if (piece.startsWith('r_')) return 'GOTE';
    return 'SENTE';
  }
  // オブジェクトならownerプロパティなど使う場合はここを変える
  return piece.owner.toUpperCase();
}

// 駒の種類を取得
function getPieceType(piece) {
  if (!piece) return null;

  if (typeof piece === 'string') {
    // まず「先手／後手の接頭辞 r_」を取り除く
    const base = piece.replace(/^r_/, '');

    if (
      base === 'fu_n'   || // と金
      base === 'keima_n' || // 成桂
      base === 'kyosha_n' || // 成香
      base === 'gin_n'     // 成銀
    ) {
      return 'kin';
    }

    // と金・成桂・成香・成銀 → 金と同じ動き
    if (
      base === 'fu_n'   || // と金
      base === 'keima_n' || // 成桂
      base === 'kyosha_n' || // 成香
      base === 'gin_n'     // 成銀
    ) {
      return 'kin';
    }

    // 成り飛車 (hisha_n) → 龍 (ryu)
    if (base === 'hisha_n') {
      return 'ryu';
    }
    // 成り角 (kaku_n) → 馬 (uma)
    if (base === 'kaku_n') {
      return 'uma';
    }

    // 上記以外の「_n」は外す (例: "ou_n" は存在しないのでここでは不要だが、念のため)
    return base.replace(/_n$/, '');
  }

  // オブジェクト (boardState の中身が { type, owner } の場合)
  const raw = piece.type; // 例: "hisha_n", "kaku_n", "fu_n" など
  if (
    raw === 'fu_n'   ||
    raw === 'keima_n' ||
    raw === 'kyosha_n' ||
    raw === 'gin_n'
  ) {
    return 'kin';
  }
  if (raw === 'hisha_n') {
    return 'ryu';
  }
  if (raw === 'kaku_n') {
    return 'uma';
  }

  return raw.replace(/_n$/, '');
}

// 全駒の動きをまとめて呼び出す関数
export function canMove(piece, fromRow, fromCol, boardState) {
  if (!piece) return [];

  const owner = getOwner(piece);
  const pieceType = getPieceType(piece);

  // 駒ごとの関数を呼ぶ
  switch (pieceType) {
    case 'fu':
      return canMove_fu(owner, fromRow, fromCol, boardState);
    case 'gin':
      return canMove_gin(owner, fromRow, fromCol, boardState);
    case 'kin':
      return canMove_kin(owner, fromRow, fromCol, boardState);
    case 'kaku':
      return canMove_kaku(owner, fromRow, fromCol, boardState);
    case 'hisha':
      return canMove_hisha(owner, fromRow, fromCol, boardState);
    case 'keima':
      return canMove_keima(owner, fromRow, fromCol, boardState);
    case 'kyosha':
      return canMove_kyosha(owner, fromRow, fromCol, boardState);
    case 'ou':
      return canMove_ou(owner, fromRow, fromCol, boardState);
    case 'gyoku':
      return canMove_gyoku(owner, fromRow, fromCol, boardState);
    case 'ryu':
      return canMove_ryu(owner, fromRow, fromCol, boardState);
    case 'uma':
      return canMove_uma(owner, fromRow, fromCol, boardState);
    default:
      return [];
  }
}

// ------------------------------------
// 歩の動き
export function canMove_fu(owner, fromRow, fromCol, boardState) {
  const moves = [];
  const forward = (owner === 'SENTE') ? -1 : 1; // 先手は上方向、後手は下方向
  const toRow = fromRow + forward;

  if (toRow < 0 || toRow >= 9) return moves;

  const targetPiece = boardState[toRow][fromCol];
  if (!targetPiece || getOwner(targetPiece) !== owner) {
    moves.push([toRow, fromCol]);
  }

  return moves;
}

// 銀の動き
export function canMove_gin(owner, fromRow, fromCol, boardState) {
  const moves = [];
  const forward = (owner === 'SENTE') ? -1 : 1;

  const candidates = [
    [fromRow + forward, fromCol],      // 前
    [fromRow + forward, fromCol - 1],  // 前左
    [fromRow + forward, fromCol + 1],  // 前右
    [fromRow - forward, fromCol - 1],  // 後左
    [fromRow - forward, fromCol + 1],  // 後右
  ];

  candidates.forEach(([r, c]) => {
    if (r >= 0 && r < 9 && c >= 0 && c < 9) {
      const targetPiece = boardState[r][c];
      if (!targetPiece || getOwner(targetPiece) !== owner) {
        moves.push([r, c]);
      }
    }
  });

  return moves;
}

// 金の動き
export function canMove_kin(owner, fromRow, fromCol, boardState) {
  const moves = [];
  const forward = (owner === 'SENTE') ? -1 : 1;

  const candidates = [
    [fromRow + forward, fromCol],       // 前
    [fromRow, fromCol - 1],             // 左
    [fromRow, fromCol + 1],             // 右
    [fromRow - forward, fromCol],        // 後
    [fromRow + forward, fromCol - 1],    // 前左
    [fromRow + forward, fromCol + 1],    // 前右
  ];

  candidates.forEach(([r, c]) => {
    if (r >= 0 && r < 9 && c >= 0 && c < 9) {
      const targetPiece = boardState[r][c];
      if (!targetPiece || getOwner(targetPiece) !== owner) {
        moves.push([r, c]);
      }
    }
  });

  return moves;
}

// 角の動き
export function canMove_kaku(owner, fromRow, fromCol, boardState) {
  const moves = [];
  const directions = [
    [-1, -1],
    [-1, +1],
    [+1, -1],
    [+1, +1],
  ];

  directions.forEach(([dr, dc]) => {
    let r = fromRow + dr;
    let c = fromCol + dc;
    while (r >= 0 && r < 9 && c >= 0 && c < 9) {
      const targetPiece = boardState[r][c];
      if (!targetPiece) {
        moves.push([r, c]);
      } else {
        if (getOwner(targetPiece) !== owner) {
          moves.push([r, c]); // 敵駒は取れる
        }
        break;
      }
      r += dr;
      c += dc;
    }
  });

  return moves;
}

// 飛車の動き
export function canMove_hisha(owner, fromRow, fromCol, boardState) {
  const moves = [];
  const directions = [
    [-1, 0],  // 上
    [+1, 0],  // 下
    [0, -1],  // 左
    [0, +1],  // 右
  ];

  directions.forEach(([dr, dc]) => {
    let r = fromRow + dr;
    let c = fromCol + dc;
    while (r >= 0 && r < 9 && c >= 0 && c < 9) {
      const targetPiece = boardState[r][c];
      if (!targetPiece) {
        moves.push([r, c]);
      } else {
        if (getOwner(targetPiece) !== owner) {
          moves.push([r, c]);
        }
        break;
      }
      r += dr;
      c += dc;
    }
  });

  return moves;
}

// 桂馬の動き: （先手なら上に2進んで左右1、後手なら下に2進んで左右1）
export function canMove_keima(owner, fromRow, fromCol, boardState) {
  const moves = [];
  const forward = (owner === 'SENTE') ? -1 : 1;
  const r1 = fromRow + forward * 2;
  const cLeft = fromCol - 1;
  const cRight = fromCol + 1;

  // 「前に2、左右1」 の２通り
  [[r1, cLeft], [r1, cRight]].forEach(([r, c]) => {
    if (r >= 0 && r < 9 && c >= 0 && c < 9) {
      const targetPiece = boardState[r][c];
      if (!targetPiece || getOwner(targetPiece) !== owner) {
        moves.push([r, c]);
      }
    }
  });

  return moves;
}

// 香車の動き: 直進（前方）に何マスでも（ただし途中で自駒があればそこで止まる）
export function canMove_kyosha(owner, fromRow, fromCol, boardState) {
  const moves = [];
  const forward = (owner === 'SENTE') ? -1 : 1;
  let r = fromRow + forward;
  const c = fromCol;

  while (r >= 0 && r < 9) {
    const targetPiece = boardState[r][c];
    if (!targetPiece) {
      moves.push([r, c]);
    } else {
      if (getOwner(targetPiece) !== owner) {
        moves.push([r, c]); // 敵駒は取れる
      }
      break;
    }
    r += forward;
  }

  return moves;
}

// 王の動き: 周囲8方向に1マスずつ
export function canMove_ou(owner, fromRow, fromCol, boardState) {
  const moves = [];
  const deltas = [
    [-1,  0], // 上
    [+1,  0], // 下
    [ 0, -1], // 左
    [ 0, +1], // 右
    [-1, -1], // 左上
    [-1, +1], // 右上
    [+1, -1], // 左下
    [+1, +1], // 右下
  ];

  deltas.forEach(([dr, dc]) => {
    const r = fromRow + dr;
    const c = fromCol + dc;
    if (r >= 0 && r < 9 && c >= 0 && c < 9) {
      const targetPiece = boardState[r][c];
      if (!targetPiece || getOwner(targetPiece) !== owner) {
        moves.push([r, c]);
      }
    }
  });

  return moves;
}

// 玉の動き
export function canMove_gyoku(owner, fromRow, fromCol, boardState) {
  const moves = [];
  const deltas = [
    [-1,  0], // 上
    [+1,  0], // 下
    [ 0, -1], // 左
    [ 0, +1], // 右
    [-1, -1], // 左上
    [-1, +1], // 右上
    [+1, -1], // 左下
    [+1, +1], // 右下
  ];

  deltas.forEach(([dr, dc]) => {
    const r = fromRow + dr;
    const c = fromCol + dc;
    if (r >= 0 && r < 9 && c >= 0 && c < 9) {
      const targetPiece = boardState[r][c];
      if (!targetPiece || getOwner(targetPiece) !== owner) {
        moves.push([r, c]);
      }
    }
  });

  return moves;
}

// 龍の動き: 飛車の動き + 斜め1マス
export function canMove_ryu(owner, fromRow, fromCol, boardState) {
  const moves = [];

  // (1) 飛車と同じ「縦横スライド」
  const straightDirs = [
    [-1, 0], // 上
    [+1, 0], // 下
    [0, -1], // 左
    [0, +1], // 右
  ];
  straightDirs.forEach(([dr, dc]) => {
    let r = fromRow + dr;
    let c = fromCol + dc;
    while (r >= 0 && r < 9 && c >= 0 && c < 9) {
      const targetPiece = boardState[r][c];
      if (!targetPiece) {
        moves.push([r, c]);
      } else {
        if (getOwner(targetPiece) !== owner) {
          moves.push([r, c]); // 敵駒は取れる
        }
        break; // 駒があれば止まる
      }
      r += dr;
      c += dc;
    }
  });

  // (2) 斜め1マス (王と同じ斜め移動)
  const diagonalOne = [
    [-1, -1], // 左上
    [-1, +1], // 右上
    [+1, -1], // 左下
    [+1, +1], // 右下
  ];
  diagonalOne.forEach(([dr, dc]) => {
    const r = fromRow + dr;
    const c = fromCol + dc;
    if (r >= 0 && r < 9 && c >= 0 && c < 9) {
      const targetPiece = boardState[r][c];
      if (!targetPiece || getOwner(targetPiece) !== owner) {
        moves.push([r, c]);
      }
    }
  });

  return moves;
}

// 馬の動き: 角の動き + 縦横1マス
export function canMove_uma(owner, fromRow, fromCol, boardState) {
  const moves = [];

  // (1) 角と同じ「斜めスライド」
  const diagonalDirs = [
    [-1, -1],
    [-1, +1],
    [+1, -1],
    [+1, +1],
  ];
  diagonalDirs.forEach(([dr, dc]) => {
    let r = fromRow + dr;
    let c = fromCol + dc;
    while (r >= 0 && r < 9 && c >= 0 && c < 9) {
      const targetPiece = boardState[r][c];
      if (!targetPiece) {
        moves.push([r, c]);
      } else {
        if (getOwner(targetPiece) !== owner) {
          moves.push([r, c]); // 敵駒は取れる
        }
        break; // 駒があれば止まる
      }
      r += dr;
      c += dc;
    }
  });

  // (2) 縦横1マス (王と同じ縦横移動)
  const straightOne = [
    [-1, 0], // 上
    [+1, 0], // 下
    [0, -1], // 左
    [0, +1], // 右
  ];
  straightOne.forEach(([dr, dc]) => {
    const r = fromRow + dr;
    const c = fromCol + dc;
    if (r >= 0 && r < 9 && c >= 0 && c < 9) {
      const targetPiece = boardState[r][c];
      if (!targetPiece || getOwner(targetPiece) !== owner) {
        moves.push([r, c]);
      }
    }
  });

  return moves;
}
