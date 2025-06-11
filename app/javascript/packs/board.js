import { canMove } from './move.js';
document.addEventListener('DOMContentLoaded', () => {   // DOM（HTMLのツリー構造）の完成後に処理するイベントリスナー
  let currentTurn = 'sente';  // 差し手を交互にするためのグローバル変数
  const board = document.getElementById('shogi-board');  // HTML内の[id="shogi-boad"]要素を取得
  let selectedPiece = null;  // 駒の選択状態を保存しておくための変数（クリック時に再代入される）
  let legalMoves = [];
  const goteKomadai = document.getElementById('gote-hand');
  const senteKomadai = document.getElementById('sente-hand');

  function highlightCells(moves) {
    document.querySelectorAll('.cell').forEach(cell => {
      cell.classList.remove('highlight');
    });
    moves.forEach(([r, c]) => {
      const selector = `.cell[data-row="${r}"][data-col="${c}"]`;
      const cell = document.querySelector(selector);
      if (cell) {
        cell.classList.add('highlight');
      }
    });
  }
  
  function clearHighlights() {
    document.querySelectorAll('.cell').forEach(cell => {
      cell.classList.remove('highlight');
    });
    legalMoves = [];
  }

  // 成り可能な駒かをチェックする補助関数
  function canPromote(pieceType) {
    return ['fu', 'kyosha', 'keima', 'gin', 'kaku', 'hisha'].includes(pieceType.replace('r_', '').replace('_n', ''));
  }

  // 成れる段かを判定する関数（3段目以内か）
  function isPromotionZone(row, owner) {
    return owner === 'sente' ? row <= 2 : row >= 6;
  }

  // 成る処理を実行する関数（画像のsrcを書き換える）
  function promotePiece(pieceImg) {
    const srcParts = pieceImg.src.split('/');
    const filename = srcParts.pop();
    if (filename.includes('_n')) return; // すでに成っていたら何もしない

    const newFilename = filename.replace('.png', '_n.png');
    pieceImg.src = [...srcParts, newFilename].join('/');
  }

  // 選択された駒のスタイルをリセットする補助関数
  function resetPieceStyle(img) {
    img.style.transform = '';
    img.style.boxShadow = '';
    img.style.zIndex = '';
    img.style.opacity = '1';
  }

  // 駒ファイルの名前から先手か後手を判別する補助関数
  function getOwnerOfMovingPiece(img) {
    const filename = img.src.split('/').pop();  // 画像ファイル名の抽出(fu.ping, r_fu.pingなど)
    return filename.startsWith('r_') ? 'gote' : 'sente';  // "r_"の有無による三項演算子
  }

  // 盤上の駒を移動させる主関数（相手の駒があれば自分の駒台に移動）
  function movePiece(fromCell, toCell) {
    const movingPiece = fromCell.querySelector('img');
    const targetPiece = toCell.querySelector('img');

    // boardStateの更新処理
    const fromRow = fromCell.dataset.row !== undefined ? parseInt(fromCell.dataset.row) : null;
    const fromCol = fromCell.dataset.col !== undefined ? parseInt(fromCell.dataset.col) : null;
    const toRow = toCell.dataset.row !== undefined ? parseInt(toCell.dataset.row) : null;
    const toCol = toCell.dataset.col !== undefined ? parseInt(toCell.dataset.col) : null;

    // 成りの判定要素の用意
    const pieceType = movingPiece.src.split('/').pop().replace('.png', '').replace(/^r_/, '');
    const owner = movingPiece.src.includes('r_') ? 'gote' : 'sente';

    const isFromBoard = fromCell.parentNode === board || fromCell === board;  // fromCell,toCellが盤上セルであるかチェック
    const isToBoard = toCell.parentNode === board || toCell === board;

    if (!isFromBoard || !isToBoard) {  // 盤上のセル以外から駒を取ることを制限
      return;
    }

    // 移動先に駒がある場合の処理 
    if (targetPiece) {
      let filename = targetPiece.src.split('/').pop();  // 画像ファイル名の抽出(fu.ping, r_fu.pingなど)

      filename = filename.replace('_n', '');  // とった駒の成解除

      if (filename.startsWith('r_')) {  // ファイル名が"r_"で始まるかチェック
        filename = filename.replace('r_', '');  // trueなら"r_"を削除
      } else {
        filename = 'r_' + filename;  // elseなら"r_"を追加
      }
      targetPiece.src = `/assets/koma/${filename}`;  // 画像パスの更新

      const owner = getOwnerOfMovingPiece(movingPiece);  // 先後判別の補助関数
      const komadai = owner === 'sente'  // 自分が先手かチェック
        ? document.getElementById('sente-hand')  // trueなら先手の駒台へ
        : document.getElementById('gote-hand');  // elseなら後手の駒台へ

      // 取った駒を駒台に移動 
      komadai.appendChild(targetPiece);
      targetPiece.style.width = '60px';
      targetPiece.style.height = '60px';
    }

    toCell.innerHTML = '';  // 移動先セルを空にする
    toCell.appendChild(movingPiece);  // 選択駒を移動先セルに移す  

    const row = toRow;

    let finalPieceType = pieceType;
      if (!pieceType.includes('_n')) {

        const isForcedPromotion =
          (pieceType === 'fu' || pieceType === 'kyosha') &&
          ((owner === 'sente' && row === 0) || (owner === 'gote' && row === 8)) ||
          (pieceType === 'keima' &&
          ((owner === 'sente' && (row === 0 || row === 1)) ||
            (owner === 'gote' && (row === 8 || row === 7))));

        const isOptionalPromotion =
        canPromote(pieceType) &&
        (isPromotionZone(fromRow, owner) || isPromotionZone(toRow, owner));
      
        if (isForcedPromotion) {
          promotePiece(movingPiece);
          finalPieceType = pieceType + '_n';
        } else if (isOptionalPromotion) {
          const doPromote = confirm('この駒を成りますか？');
          if (doPromote) {
            promotePiece(movingPiece);
            finalPieceType = pieceType + '_n';
          }
        }
      }

    boardState[fromRow][fromCol] = null;
    boardState[toRow][toCol] = {
      type: finalPieceType,
      owner: owner
    };

    currentTurn = currentTurn === 'sente' ? 'gote' : 'sente';  // ターン交代処理
  }

  // 駒台の駒を打つ補助関数
  function dropPiece(pieceImg, toCell) {
    const filename = pieceImg.src.split('/').pop();
    const owner = getOwnerOfMovingPiece(pieceImg);

    // boardStateの更新処理
    const toRow = parseInt(toCell.dataset.row);
    const toCol = parseInt(toCell.dataset.col);

    if (getOwnerOfMovingPiece(pieceImg) !== currentTurn) {  // 手番の駒しか持てない
      return;
    }

    // 打つマスに駒があるかを判別する処理
    if (toCell.querySelector('img')) {
      return;
    }

    const pieceType = filename.replace('.png', '').replace(/^r_/, '').replace('_n', '');
    //  次に動けない位置には駒を打てない制限 
    if (pieceType === 'fu') {
      if ((owner === 'sente' && toRow === 0) ||
          (owner === 'gote'  && toRow === 8)) {
        return;
      }
    }
    if (pieceType === 'keima') {
      if ((owner === 'sente' && (toRow === 0 || toRow === 1)) ||
          (owner === 'gote'  && (toRow === 7 || toRow === 8))) {
        return;
      }
    }
    if (pieceType === 'kyosha') {
      if ((owner === 'sente' && toRow === 0) ||
          (owner === 'gote'  && toRow === 8)) {
        return;
      }
    }

    // 二歩を判別する処理
    const colIndex = parseInt(toCell.dataset.col);

    if (pieceType === 'fu') {
      const hasFuInCol = boardState.some(row => {
        const cell = row[colIndex];
        return cell && cell.owner === owner && cell.type === 'fu';
      });

      if (hasFuInCol) {
        return;
      }
    }

    // 駒台から駒を削除する
    pieceImg.parentNode.removeChild(pieceImg);
    pieceImg.style.width = '100%';
    pieceImg.style.height = '100%';
    toCell.appendChild(pieceImg);


    boardState[toRow][toCol] = {
      type: pieceType,
      owner: owner
    };

    currentTurn = currentTurn === 'sente' ? 'gote' : 'sente';  // ターン交代処理
  }

  // 将棋盤のCSS
  board.style.display = 'grid';
  board.style.gridTemplateColumns = 'repeat(9, 70px)';  // 縦（筋）
  board.style.gridTemplateRows = 'repeat(9, 77px)';  // 横（段）
  board.style.boxSizing = 'border-box';
  board.style.border = '2px solid black';
  board.style.width = 'calc(70px * 9 + 4px)';  // borderの左右4pxを考慮 *calc = cssで計算式を掛ける機能
  board.style.height = 'calc(77px * 9 + 4px)';  // borderの上下4pxを考慮

  // 初期配置データ *initialSetup[0] → 1段目（後手の一番奥）, initialSetup[8] → 9段目（先手の一番奥）
  const initialSetup = [
    ['r_kyosha', 'r_keima', 'r_gin', 'r_kin', 'r_gyoku', 'r_kin', 'r_gin', 'r_keima', 'r_kyosha'],
    [null, 'r_hisha', null, null, null, null, null, 'r_kaku', null],
    ['r_fu', 'r_fu', 'r_fu', 'r_fu', 'r_fu', 'r_fu', 'r_fu', 'r_fu', 'r_fu'],
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
    ['fu', 'fu', 'fu', 'fu', 'fu', 'fu', 'fu', 'fu', 'fu'],
    [null, 'kaku', null, null, null, null, null, 'hisha', null],
    ['kyosha', 'keima', 'gin', 'kin', 'ou', 'kin', 'gin', 'keima', 'kyosha']
  ];

  // boardStateの初期化
  let boardState = initialSetup.map(row => row.map(pieceType => {
    if (!pieceType) return null;

    const owner = pieceType.startsWith('r_') ? 'gote' : 'sente';
    const type = pieceType.replace(/^r_/, '');
    return { type, owner };
  }));

  // forループを用いた将棋盤の作成
  for (let row = 0; row < 9; row++) {  // row++ = row + 1 と同義のインクリメント
    for (let col = 0; col < 9; col++) {  // col++ = col + 1 と同義のインクリメント
      const cell = document.createElement('div');  // 新しい<div>要素をセルとして1マス生成
      cell.classList.add('cell');  // .cellクラスを追加
      cell.style.border = '1px solid #000';  // ここからセルのスタイル
      cell.style.width = '70px';
      cell.style.height = '77px';
      cell.style.display = 'flex';
      cell.style.alignItems = 'center';
      cell.style.justifyContent = 'center';
      cell.style.backgroundColor = '#cc841d';
      cell.style.boxSizing = 'border-box';  // ここまでセルのスタイル
      cell.dataset.row = row;
      cell.dataset.col = col;

      // 駒画像を盤面に配置する処理
      const piece = initialSetup[row][col];  // 初期配置配列から駒名の取得
      if (piece) {
        const img = document.createElement('img');  // <img>要素の作成
        img.src = `/assets/koma/${piece}.png`;  // 画像パスの設定
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        img.style.verticalAlign = 'middle';

        // 駒をクリックし、マスへ移動させる処理
        img.addEventListener('click', (e) => {
          e.stopPropagation();

          if (selectedPiece) {
            const isFromKomadai =
              selectedPiece.parentNode.id === 'sente-hand' ||
              selectedPiece.parentNode.id === 'gote-hand';
            if (isFromKomadai) {
              resetPieceStyle(selectedPiece);
              selectedPiece = null;
              clearHighlights();
              return;
            }
          }

          // すでに同じ駒が選択されていたら選択解除
          if (selectedPiece === img) {
            resetPieceStyle(selectedPiece);
            selectedPiece = null;
            clearHighlights();
            return;
          }

          // すでに別の駒を選択中の場合
          if (selectedPiece) {
            const selectedOwner = getOwnerOfMovingPiece(selectedPiece);
            const clickedOwner = getOwnerOfMovingPiece(img);
            if (selectedOwner === clickedOwner) {
              // 同じ所有者の駒なら選択を切り替えて再び合法手を計算
              resetPieceStyle(selectedPiece);
              clearHighlights();

              selectedPiece = img;
              img.style.transform = 'translate(-5px, -5px)';
              img.style.zIndex = '10';
              img.style.boxShadow = '0 0 10px 5px rgba(255, 255, 255, 0.8)';

              const cell = img.parentNode;
              const r = parseInt(cell.dataset.row);
              const c = parseInt(cell.dataset.col);

              // move.js の canMove を呼んで合法マスを取得
              legalMoves = canMove(boardState[r][c], r, c, boardState);
              highlightCells(legalMoves);
            } else {
              // 異なる所有者の駒なら「取る」動作。ここでも、取るマスが合法に含まれているかチェックする
              const toCell = img.parentNode;
              const toRow = parseInt(toCell.dataset.row);
              const toCol = parseInt(toCell.dataset.col);
              const isLegal = legalMoves.some(([r0, c0]) => r0 === toRow && c0 === toCol);
              if (isLegal) {
                // 合法であればキャプチャ動作
                resetPieceStyle(selectedPiece);
                movePiece(selectedPiece.parentNode, toCell);
              }
              // 合法でなかろうと、選択は必ず解除
              resetPieceStyle(selectedPiece);
              selectedPiece = null;
              clearHighlights();
            }
            return;
          }

          // 手番でない駒は選択できない
          if (getOwnerOfMovingPiece(img) !== currentTurn) {
            return;
          }

          // 駒を選択 → スタイル変更 → 合法マスをハイライト
          selectedPiece = img;
          img.style.transform = 'translate(-5px, -5px)';
          img.style.zIndex = '10';
          img.style.boxShadow = '0 0 10px 5px rgba(255, 255, 255, 0.8)';

          const cell = img.parentNode;
          const fromR = parseInt(cell.dataset.row);
          const fromC = parseInt(cell.dataset.col);

          legalMoves = canMove(boardState[fromR][fromC], fromR, fromC, boardState);
          highlightCells(legalMoves);
        });

        cell.appendChild(img);
      }

      cell.addEventListener('click', () => {
        if (!selectedPiece) return;

        const selectedOwner = getOwnerOfMovingPiece(selectedPiece);
        const fromCell = selectedPiece.parentNode;
        const toCell = cell;
        const toRow = parseInt(toCell.dataset.row);
        const toCol = parseInt(toCell.dataset.col);

        // 盤上移動の合法手チェック
        const isFromKomadai =
          selectedPiece.parentNode.id === 'sente-hand' || selectedPiece.parentNode.id === 'gote-hand';

        if (isFromKomadai) {
          // 駒台から「打つ」場合は単純に dropPiece 
          dropPiece(selectedPiece, toCell);
          resetPieceStyle(selectedPiece);
          selectedPiece = null;
          clearHighlights();
          return;
        }

        // 盤上移動の場合、legalMoves に含まれていないなら何もしない
        const isLegal = legalMoves.some(([r0, c0]) => r0 === toRow && c0 === toCol);
        if (!isLegal) {
          return;
        }

        // 合法手なら実際に movePiece
        movePiece(fromCell, toCell);
        resetPieceStyle(selectedPiece);
        selectedPiece = null;
        clearHighlights();
      });

      board.appendChild(cell);
    }
  }
  // 将棋盤以外(背景や空白)をクリックした際の処理
  document.body.addEventListener('click', () => {  // 空白にクリックイベントを追加
    if (selectedPiece) {  // 駒を選択している状態かチェック
      resetPieceStyle(selectedPiece);
      selectedPiece = null;
      clearHighlights();
    }
  });
});