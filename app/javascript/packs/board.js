import { canMove } from './move.js';

document.addEventListener('DOMContentLoaded', () => {
  // ===================================================================
  // グローバル変数と定数
  // ===================================================================
  let currentTurn = 'sente';
  const board = document.getElementById('shogi-board');
  let selectedPiece = null;
  let legalMoves = [];

  const jkfText = document.getElementById("jkf-data").textContent;
  const jkf = JSON.parse(jkfText);

  const boardPieceWidth = 65;
  const boardPieceHeight = 76;

  const pieceTypeToKey = { 'fu': 'FU', 'kyosha': 'KY', 'keima': 'KE', 'gin': 'GI', 'kin': 'KI', 'kaku': 'KA', 'hisha': 'HI', 'ou': 'OU', 'gyoku': 'OU', 'tokin': 'FU', 'narikyo': 'KY', 'narikei': 'KE', 'narigin': 'GI', 'uma': 'KA', 'ryu': 'HI' };
  const pieceKeyToType = { 'FU': 'fu', 'KY': 'kyosha', 'KE': 'keima', 'GI': 'gin', 'KI': 'kin', 'KA': 'kaku', 'HI': 'hisha', 'OU': 'ou' };

  let initialSetup = [];
  let boardState = [];

  let hand = { sente: {}, gote: {} };
  let replayCurrent = 0;
  let kifuComments = {};
  const jkfMoves = jkf.moves;
  const btnNext = document.getElementById("btn-next");
  const btnBack = document.getElementById("btn-back");

  const zenkakuNumbers = ['１', '２', '３', '４', '５', '６', '７', '８', '９'];
  const kanjiNumbers = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
  const pieceToKanji = {
    'FU': '歩', 'KY': '香', 'KE': '桂', 'GI': '銀', 'KI': '金', 'KA': '角', 'HI': '飛', 'OU': '玉',
    'TO': 'と', 'NY': '杏', 'NK': '圭', 'NG': '全', 'UM': '馬', 'RY': '竜'
  };

  const specialMoveToKanji = {
    'TORYO': '投了',
    'CHUDAN': '中断',
    'SENNICHITE': '千日手',
    'JISHOGI': '持将棋',
    'ILLEGAL_MOVE': '反則負け'
    // 他にも必要であれば追加
  };

  // --- 記号挿入ボタンの処理 ---
  const inputArea = document.getElementById('comment-input-area');
  const senteBtn = document.getElementById('insert-sente-symbol');
  const goteBtn = document.getElementById('insert-gote-symbol');

  // ===================================================================
  // イベントハンドラ（クリックされた時の主要な処理）
  // ===================================================================

  /**
   * テキストエリアのカーソル位置にテキストを挿入する関数
   * @param {string} textToInsert - 挿入するテキスト (例: '▲')
   */
  function insertAtCursor(textToInsert) {
    // テキストエリア要素がなければ何もしない
    if (!inputArea) return;

    const cursorPos = inputArea.selectionStart; // 現在のカーソル位置
    const currentValue = inputArea.value;      // 現在のテキスト全体
    
    const textBefore = currentValue.substring(0, cursorPos); // カーソル前のテキスト
    const textAfter = currentValue.substring(cursorPos);     // カーソル後のテキスト

    // テキストを挿入して、テキストエリアの値を更新
    inputArea.value = textBefore + textToInsert + textAfter;

    // カーソル位置を挿入したテキストの直後に移動させる
    const newCursorPos = cursorPos + textToInsert.length;
    inputArea.selectionStart = newCursorPos;
    inputArea.selectionEnd = newCursorPos;

    // テキストエリアにフォーカスを戻し、ユーザーがすぐに入力を続けられるようにする
    inputArea.focus();
  }

  // 各ボタンのクリックイベントを設定
  if (senteBtn) {
    senteBtn.addEventListener('click', (e) => {
      e.preventDefault(); // ボタン本来の動作（フォーム送信など）をキャンセル
      insertAtCursor('▲');
    });
  }

  if (goteBtn) {
    goteBtn.addEventListener('click', (e) => {
      e.preventDefault();
      insertAtCursor('△');
    });
  }

  /**
   * 指定されたマスが、指定されたプレイヤーの成れるゾーン（敵陣）かどうかを判定する
   * @param {number} row - 判定するマスの行 (0-8)
   * @param {string} owner - プレイヤー ('sente' or 'gote')
   * @returns {boolean} - 成れるゾーンであれば true
   */
  function isPromotionZone(row, owner) {
    if (owner === 'sente') {
      // 先手の成りゾーンは奥の3段 (行番号 0, 1, 2)
      return row <= 2;
    } else if (owner === 'gote') {
      // 後手の成りゾーンは手前の3段 (行番号 6, 7, 8)
      return row >= 6;
    }
    return false;
  }

  /**
   * 盤上または駒台の「駒画像」がクリックされた時の処理
   * @param {MouseEvent} e - クリックイベント
   */
  function handlePieceClick(e) {
    e.stopPropagation(); // 親要素（マス）へのクリックイベント伝播を停止
    const clickedImg = e.target;

    // --- 既に何かを選択中の場合の処理 ---
    if (selectedPiece) {
      // 選択中の駒が、今クリックした駒と同じなら、選択解除
      if (selectedPiece === clickedImg) {
        resetPieceStyle(selectedPiece);
        selectedPiece = null;
        clearHighlights();
        return;
      }

      const selectedOwner = getOwnerOfMovingPiece(selectedPiece);
      const clickedOwner = getOwnerOfMovingPiece(clickedImg);

      // 選択中の駒とクリックされた駒が同じプレイヤーのものなら、選択対象を切り替える
      if (selectedOwner === clickedOwner) {
        resetPieceStyle(selectedPiece);
        clearHighlights();
        selectPiece(clickedImg);
      } else {
        // 異なるプレイヤーの駒なら「取る」動作
        const toCell = clickedImg.parentNode;
        // その移動が合法手かチェック
        const toRow = parseInt(toCell.dataset.row);
        const toCol = parseInt(toCell.dataset.col);
        const isLegal = legalMoves.some(([r, c]) => r === toRow && c === toCol);
        
        if (isLegal) {
          movePiece(selectedPiece.parentNode, toCell);
        }
        
        // いずれにせよ選択は解除
        resetPieceStyle(selectedPiece);
        selectedPiece = null;
        clearHighlights();
      }
      return;
    }

    // --- まだ何も選択していない場合の処理 ---

    // 手番ではない駒は選択できない
    if (getOwnerOfMovingPiece(clickedImg) !== currentTurn) {
      return;
    }

    // 駒を選択状態にする
    selectPiece(clickedImg);
  }

  /**
   * 盤上の「マス（セル）」がクリックされた時の処理
   * @param {MouseEvent} e - クリックイベント
   */
  function handleCellClick(e) {
    if (!selectedPiece) return; // 何も選択されていなければ何もしない
    const toCell = e.currentTarget; // クリックされたマス自身

    // ★★★ ここから修正 ★★★

    // 選択中の駒が駒台にあるかどうかを判定する
    const isDropping = selectedPiece.closest('#sente-hand, #gote-hand');

    const toRow = parseInt(toCell.dataset.row);
    const toCol = parseInt(toCell.dataset.col);

    // クリックされたマスが合法手かどうかをチェック
    const isLegal = legalMoves.some(([r, c]) => r === toRow && c === toCol);
    if (!isLegal) {
      // 合法手でない空のセルをクリックした場合は、選択を解除する
      if (toCell.children.length === 0) {
          resetPieceStyle(selectedPiece);
          selectedPiece = null;
          clearHighlights();
      }
      return;
    }
    
    // 駒台の駒を「打つ」場合
    if (isDropping) {
      dropPiece(selectedPiece, toCell);
    } 
    // 盤上の駒を「移動」させる場合
    else {
      // isDroppingがfalseの場合、selectedPieceの親は必ず.cellなので安全
      const fromCell = selectedPiece.parentNode;
      movePiece(fromCell, toCell); 
    }
    
    // 動作後は必ず選択解除
    resetPieceStyle(selectedPiece);
    selectedPiece = null;
    clearHighlights();
  }

  // ===================================================================
  // 補助関数群
  // ===================================================================

  /**
   * JKFの指し手オブジェクトを日本語棋譜形式の文字列に変換する（修正版）
   * @param {object} moveObject - JKFの指し手オブジェクト
   * @returns {string} - 例: "▲７六歩(77)" や "投了"
   */
  function jkfMoveToJPN(moveObject) {
    // moveObjectが空かチェック
    if (!moveObject) { return ''; }

    // 投了などの特殊な指し手
    if (moveObject.special) {
      return specialMoveToKanji[moveObject.special] || moveObject.special;
    }

    // 通常の指し手
    if (moveObject.move) {
      const move = moveObject.move;
      const turnSymbol = move.color === 0 ? '▲' : '△';
      const toX = zenkakuNumbers[move.to.x - 1];
      const toY = kanjiNumbers[move.to.y - 1];
      const pieceKanji = pieceToKanji[move.piece];

      let fromStr = '';
      let promoteStr = '';

      if (move.promote) {
        promoteStr = '成';
      }
      if (move.from) {
        fromStr = `(${move.from.x}${move.from.y})`;
      } else {
        fromStr = '打';
        promoteStr = '';
      }
      return `${turnSymbol}${toX}${toY}${pieceKanji}${promoteStr}${fromStr}`;
    }

    // moveもspecialも無い場合（コメントのみの要素など）は空文字を返す
    return '';
  }
  
  /**
   * 棋譜リストをHTMLに描画する（レイアウト修正版）
   */
  function renderMoveList() {
    const listContainer = document.getElementById('kifu-move-list');
    if (!listContainer) return;

    listContainer.innerHTML = ''; // 一旦空にする

    // 「初期局面」の項目
    const initialItem = document.createElement('div');
    initialItem.className = 'move-item';
    initialItem.dataset.moveNumber = 0;
    // --- 盤面描画の修正に倣って、こちらもspanで構成 ---
    const initialNumSpan = document.createElement('span');
    initialNumSpan.className = 'move-number';
    initialNumSpan.textContent = 0;
    const initialTextSpan = document.createElement('span');
    initialTextSpan.className = 'move-text';
    initialTextSpan.textContent = '初期局面';
    initialItem.appendChild(initialNumSpan);
    initialItem.appendChild(initialTextSpan);
    if (kifuComments[0]) {
      const commentIndicator = document.createElement('span');
      commentIndicator.className = 'comment-indicator';
      commentIndicator.textContent = '📝';
      initialItem.appendChild(commentIndicator);
    }
    listContainer.appendChild(initialItem);


    // 1手目以降のループ
    for (let i = 1; i < jkfMoves.length; i++) {
      const moveItem = document.createElement('div');
      moveItem.className = 'move-item';
      moveItem.dataset.moveNumber = i;

      // ▼▼▼ この部分を、すべてspan要素を生成する方法に統一します ▼▼▼

      // 1. 手数を表示するspan要素を作成
      const moveNumberSpan = document.createElement('span');
      moveNumberSpan.className = 'move-number';
      moveNumberSpan.textContent = i;

      // 2. 指し手テキストを表示するspan要素を作成
      const moveTextSpan = document.createElement('span');
      moveTextSpan.className = 'move-text';
      moveTextSpan.textContent = jkfMoveToJPN(jkfMoves[i]);

      // 3. moveItemの中に、手数と指し手のspan要素を追加
      moveItem.appendChild(moveNumberSpan);
      moveItem.appendChild(moveTextSpan);

      // 4. コメントがあれば、目印のspan要素を追加
      if (kifuComments[i]) {
        const commentIndicator = document.createElement('span');
        commentIndicator.className = 'comment-indicator';
        commentIndicator.textContent = '📝コメント有';
        moveItem.appendChild(commentIndicator);
      }
      
      // ▲▲▲ ここまで ▲▲▲

      listContainer.appendChild(moveItem);
    }
  }
  
  /**
   * 棋譜リストの現在の指し手をハイライトする
   */
  function highlightCurrentMoveInList() {
    const listContainer = document.getElementById('kifu-move-list');
    if (!listContainer) return;
  
    // 以前のハイライトを削除
    const prevActive = listContainer.querySelector('.active-move');
    if (prevActive) {
      prevActive.classList.remove('active-move');
    }
  
    // 現在の手番の要素を探してハイライト
    const currentMoveElement = listContainer.querySelector(`[data-move-number="${replayCurrent}"]`);
    if (currentMoveElement) {
      currentMoveElement.classList.add('active-move');
      // ハイライトした要素が画面内に表示されるようにスクロール
      currentMoveElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  /**
   * 現在の手番のコメントを表示/入力欄に反映する
   */
  function displayCurrentComment() {
    // ★表示エリアに関する行を削除
    const inputArea = document.getElementById('comment-input-area');
    const comment = kifuComments[replayCurrent] || ''; // 保存されたコメントを取得
  
    // テキストエリアにコメントを直接設定する
    inputArea.value = comment; 
  }

  /**
   * HTMLのdata属性からコメントを読み込む
   */
  function loadComments() {
    const container = document.getElementById('shogi-container');
    if (container && container.dataset.comments) {
      // JSON文字列をパースして kifuComments に格納
      kifuComments = JSON.parse(container.dataset.comments);
    } else {
      kifuComments = {};
    }
  }

  /**
   * 入力されたコメントをサーバーに送信して保存する
   */
  async function saveComment() {
    const container = document.getElementById('shogi-container');
    const kifuId = container.dataset.kifuId;

    const inputArea = document.getElementById('comment-input-area');
    const commentText = inputArea.value; // trim() は削除。空文字を送って削除を実現するため。

    // RailsのCSRFトークンを取得（Railsアプリでは必須）
    const token = document.querySelector('meta[name="csrf-token"]').content;

    try {
      const response = await fetch(`/kifus/${kifuId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': token // CSRFトークンをヘッダーに含める
        },
        body: JSON.stringify({
          move_number: replayCurrent,
          body: commentText
        })
      });

      if (!response.ok) {
        throw new Error('サーバーとの通信に失敗しました。');
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        // 成功したら、ローカルのコメントデータも更新
        if (commentText) {
          kifuComments[replayCurrent] = commentText;
        } else {
          delete kifuComments[replayCurrent];
        }
        displayCurrentComment();
        renderMoveList();
      } else {
        alert('保存に失敗しました: ' + result.errors.join(', '));
      }

    } catch (error) {
      console.error('Error:', error);
      alert('エラーが発生しました。');
    }
  }

  /**
   * 手数カウンターの表示を更新する
   */
  function updateMoveCounter() {
    const counterElement = document.getElementById('move-counter');
    if (counterElement) {
      counterElement.textContent = `${replayCurrent}`;
    }
  }

  /**
   * 指定されたマスの下に成り/不成の駒画像UIを表示し、ユーザーが画像をクリックするまで待つ
   * @param {HTMLDivElement} targetCell - UIを表示する基準となるマス要素
   * @param {object} pieceData - 動かす駒のデータ { type, owner }
   * @returns {Promise<boolean>} - 「成る」画像がクリックされたら true、「成らない」なら false を返す
   */
  function waitForPromotionChoice(targetCell, pieceData) { // ★変更点1: pieceData を追加
    return new Promise(resolve => {
      const promotionUI = document.getElementById('promotion-choice');
      // ★変更点2: ボタンから画像要素の取得に変更
      const yesImg = document.getElementById('promote-yes-img');
      const noImg = document.getElementById('promote-no-img');
      const board = document.getElementById('shogi-board');

      // ★変更点3: pieceData に基づいて表示する画像のURLを動的に設定
      const ownerPrefix = pieceData.owner === 'gote' ? 'r_' : '';
      // 「成る」画像のURL（例: /assets/koma/fu_n.png）
      yesImg.src = `/assets/koma/${ownerPrefix}${pieceData.type}_n.png`;
      // 「成らない」画像のURL（例: /assets/koma/fu.png）
      noImg.src = `/assets/koma/${ownerPrefix}${pieceData.type}.png`;

      const rect = targetCell.getBoundingClientRect();
      promotionUI.style.top = `${rect.bottom + window.scrollY + 5}px`;
      promotionUI.style.left = `${rect.left + window.scrollX + rect.width / 2}px`;
      promotionUI.style.transform = 'translateX(-50%)';

      board.style.pointerEvents = 'none';
      promotionUI.style.display = 'block';

      const handleChoice = (promotes) => {
        promotionUI.style.display = 'none';
        promotionUI.style.transform = '';
        board.style.pointerEvents = 'auto';
        resolve(promotes);
      };

      // ★変更点4: イベントリスナーを画像に設定
      yesImg.addEventListener('click', () => handleChoice(true), { once: true });
      noImg.addEventListener('click', () => handleChoice(false), { once: true });
    });
  }
  
  function selectPiece(img) {
    selectedPiece = img;
    img.style.transform = 'translate(-4px, -6px)';
    img.style.zIndex = '10';
    img.style.filter = 'drop-shadow(0 0 3px white)';
  
    const cell = img.parentNode;
    
    // 盤上の駒の場合
    if (cell.classList.contains('cell')) {
      const r = parseInt(cell.dataset.row);
      const c = parseInt(cell.dataset.col);
      legalMoves = canMove(boardState[r][c], r, c, boardState);
      highlightCells(legalMoves);
    } 
    // ★駒台の駒の場合の処理を追加★
    else {
      const owner = getOwnerOfMovingPiece(img);
      const pieceKey = img.alt;
      legalMoves = calculateDroppableCells(pieceKey, owner);
      highlightCells(legalMoves);
    }
  }

  function getOwnerOfMovingPiece(img) {
    return img.src.includes('/r_') ? 'gote' : 'sente';
  }

  function resetPieceStyle(img) {
    img.style.transform = '';
    img.style.boxShadow = '';
    img.style.filter = '';
    img.style.zIndex = '';
  }

  function highlightCells(moves) {
    document.querySelectorAll('.cell').forEach(cell => cell.classList.remove('highlight'));
    moves.forEach(([r, c]) => {
      const cell = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
      if (cell) cell.classList.add('highlight');
    });
  }

  function clearHighlights() {
    document.querySelectorAll('.cell').forEach(cell => cell.classList.remove('highlight'));
    legalMoves = [];
  }

  /**
   * 指定された駒を打つことが可能な全てのマスを計算して返す
   * @param {string} pieceKey - 打つ駒のキー ('FU', 'KA'など)
   * @param {string} owner - 手番のプレイヤー ('sente' or 'gote')
   * @returns {Array<[number, number]>} - 配置可能なマスの [row, col] の配列
   */
  function calculateDroppableCells(pieceKey, owner) {
    const droppableCells = [];
    const pieceType = pieceKeyToType[pieceKey];

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        // 【ルール1】駒が置かれているマスには打てない
        if (boardState[r][c]) {
          continue;
        }

        // 【ルール2】行き所のない駒のチェック
        if (pieceType === 'fu' || pieceType === 'kyosha') {
          if ((owner === 'sente' && r === 0) || (owner === 'gote' && r === 8)) {
            continue;
          }
        }
        if (pieceType === 'keima') {
          if ((owner === 'sente' && r <= 1) || (owner === 'gote' && r >= 7)) {
            continue;
          }
        }

        // 【ルール3】二歩のチェック
        if (pieceType === 'fu') {
          let nifu = false;
          for (let row = 0; row < 9; row++) {
            const pieceOnBoard = boardState[row][c];
            if (pieceOnBoard && pieceOnBoard.owner === owner && pieceOnBoard.type === 'fu') {
              nifu = true;
              break;
            }
          }
          if (nifu) {
            continue;
          }
        }

        // 全てのルールをクリアしたマスを追加
        droppableCells.push([r, c]);
      }
    }
    return droppableCells;
  }

  // ===================================================================
  // 駒の操作ロジック（手動操作用）
  // ===================================================================

  async function movePiece(fromCell, toCell) {
    const fromRow = parseInt(fromCell.dataset.row);
    const fromCol = parseInt(fromCell.dataset.col);
    const toRow = parseInt(toCell.dataset.row);
    const toCol = parseInt(toCell.dataset.col);

    const movingPieceData = boardState[fromRow][fromCol];
    if (!movingPieceData) return;

    // 相手の駒を取る処理
    const targetPieceData = boardState[toRow][toCol];
    if (targetPieceData) {
      const capturedType = targetPieceData.type.replace('_n', '');
      const capturedPieceKey = pieceTypeToKey[capturedType];
      if (capturedPieceKey) {
        hand[movingPieceData.owner][capturedPieceKey]++;
      }
    }
    
    let promote = false; // 最終的に成るかどうかを管理する変数
    const pieceType = movingPieceData.type;
    const owner = movingPieceData.owner;
  
    // 【1. 強制成りの判定】
    // 歩または香車が敵陣の最終段に到達した場合
    if ((pieceType === 'fu' || pieceType === 'kyosha') &&
        ((owner === 'sente' && toRow === 0) || (owner === 'gote' && toRow === 8))) {
      promote = true; // 強制的に成る
    }
    // 桂馬が敵陣の最終・準最終段に到達した場合
    else if (pieceType === 'keima' &&
             ((owner === 'sente' && toRow <= 1) || (owner === 'gote' && toRow >= 7))) {
      promote = true; // 強制的に成る
    }
    // 【2. 選択成りの判定】
    else {
      const canPromotePiece = ['fu', 'kyosha', 'keima', 'gin', 'kaku', 'hisha'].includes(pieceType);
      if (canPromotePiece && (isPromotionZone(toRow, owner) || isPromotionZone(fromRow, owner))) {
        
        // ★変更点: waitForPromotionChoice に movingPieceData を渡す
        const userChoosesToPromote = await waitForPromotionChoice(fromCell, movingPieceData); 
        
        if (userChoosesToPromote) {
          promote = true;
        }
      }
    }
  
    // promoteがtrueに設定されていたら、駒の種類を成りに更新
    if (promote) {
      movingPieceData.type += '_n';
    }

    // boardStateを更新
    boardState[toRow][toCol] = movingPieceData;
    boardState[fromRow][fromCol] = null;
    
    // ターンを交代
    currentTurn = (currentTurn === 'sente') ? 'gote' : 'sente';
    
    // 盤面と駒台を再描画
    drawFullBoard();
    drawHands();
  }

    /**
     * 駒台の駒を盤上に打つ（ルールチェック機能付き）
     * @param {HTMLImageElement} pieceImg - 打つ駒の画像要素
     * @param {HTMLDivElement} toCell - 配置先のマス要素
     */
    function dropPiece(pieceImg, toCell) {
      // 1. 駒を打つために必要な情報を取得
      const owner = getOwnerOfMovingPiece(pieceImg);
      const pieceKey = pieceImg.alt; // 'FU', 'KA'など
      const pieceType = pieceKeyToType[pieceKey]; // 'fu', 'kaku'など
      const toRow = parseInt(toCell.dataset.row);
      const toCol = parseInt(toCell.dataset.col);
    
      // 1. 盤面の状態(boardState)を更新
      boardState[toRow][toCol] = { type: pieceType, owner: owner };
    
      // 2. 持ち駒の状態(hand)を更新
      hand[owner][pieceKey]--;
    
      // 3. 手番を交代
      currentTurn = (currentTurn === 'sente') ? 'gote' : 'sente';
    
      // 4. 盤面と駒台を再描画して、画面に反映
      drawFullBoard();
      drawHands();
    }
  // ===================================================================
  // 盤面描画・初期化
  // ===================================================================

  function setupInitialBoard() {
    const preset = (jkf.initial && jkf.initial.preset) ? jkf.initial.preset : 'HIRATE';
    if (preset === 'HIRATE') {
      initialSetup = [
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
    }
    board.style.display = 'grid';
    board.style.gridTemplateColumns = `repeat(9, 70px)`;
    board.style.gridTemplateRows = `repeat(9, 77px)`;
    board.style.width = 'calc(70px * 9 + 4px)';
    board.style.height = 'calc(77px * 9 + 4px)';
    board.style.border = '2px solid black';
    board.style.boxSizing = 'border-box';
  }
  
  function resetBoardToInitial() {
    boardState = initialSetup.map(row => row.map(pieceStr => {
      if (!pieceStr) return null;
      const owner = pieceStr.startsWith('r_') ? 'gote' : 'sente';
      const type = pieceStr.replace(/^r_/, '');
      return { type, owner };
    }));
    hand = { sente: {}, gote: {} };
    Object.keys(pieceKeyToType).forEach(key => {
        hand.sente[key] = 0;
        hand.gote[key] = 0;
    });
  }
  
  function drawFullBoard() {
    board.innerHTML = '';
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.style.cssText = `border: 1px solid #000; width: 70px; height: 77px; display: flex; align-items: center; justify-content: center; background-color: #cc841d; box-sizing: border-box;`;
        cell.dataset.row = row;
        cell.dataset.col = col;
        cell.addEventListener('click', handleCellClick);
        const piece = boardState[row][col];
        if (piece) {
          const img = document.createElement('img');
          const ownerPrefix = piece.owner === 'gote' ? 'r_' : '';
          img.src = `/assets/koma/${ownerPrefix}${piece.type}.png`;
          img.style.width = `${boardPieceWidth}px`;
          img.style.height = `${boardPieceHeight}px`;
          img.style.objectFit = 'contain';
          img.addEventListener('click', handlePieceClick);
          cell.appendChild(img);
        }
        board.appendChild(cell);
      }
    }
  }

  function drawHands() {
    const senteDiv = document.getElementById("sente-hand");
    const goteDiv = document.getElementById("gote-hand");
    senteDiv.innerHTML = "";
    goteDiv.innerHTML = "";
    const pieceOrder = ["HI", "KA", "KI", "GI", "KE", "KY", "FU"];
    const pieceWidth = 60;
    const pieceHeight = 66;
    const offset = 4;
    for (const piece of pieceOrder) {
      const pieceCount = hand.sente[piece];
      if (pieceCount > 0) {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `position: relative; display: inline-block; margin: 0 5px; width: ${pieceWidth + (pieceCount - 1) * offset}px; height: ${pieceHeight + (pieceCount - 1) * offset}px;`;
        for (let i = 0; i < pieceCount; i++) {
          const img = document.createElement("img");
          img.src = `/assets/koma/${piece.toLowerCase()}.png`;
          img.alt = piece; // 駒の種類をaltに保存
          img.style.cssText = `width: ${pieceWidth}px; height: ${pieceHeight}px; position: absolute; top: ${i * offset}px; left: ${i * offset}px; z-index: ${i}; filter: drop-shadow(1px 0 0 #222) drop-shadow(-1px 0 0 #222) drop-shadow(0 1px 0 #222) drop-shadow(0 -1px 0 #222); cursor: pointer;`;
          img.addEventListener('click', handlePieceClick); // 駒台の駒にもクリックイベント
          wrapper.appendChild(img);
        }
        if (pieceCount > 1) {
          const countSpan = document.createElement('span');
          countSpan.textContent = pieceCount;
          countSpan.style.cssText = `position: absolute; right: 5px; bottom: 2px; z-index: ${pieceCount}; color: white; font-weight: bold; font-size: 1.2rem; text-shadow: 0 0 4px black, 0 0 4px black; pointer-events: none;`;
          wrapper.appendChild(countSpan);
        }
        senteDiv.appendChild(wrapper);
      }
    }
    for (const piece of pieceOrder) {
      const pieceCount = hand.gote[piece];
      if (pieceCount > 0) {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `position: relative; display: inline-block; margin: 0 5px; width: ${pieceWidth + (pieceCount - 1) * offset}px; height: ${pieceHeight + (pieceCount - 1) * offset}px;`;
        for (let i = 0; i < pieceCount; i++) {
          const img = document.createElement("img");
          img.src = `/assets/koma/r_${piece.toLowerCase()}.png`;
          img.alt = piece; // 駒の種類をaltに保存
          img.style.cssText = `width: ${pieceWidth}px; height: ${pieceHeight}px; position: absolute; top: ${i * offset}px; left: ${i * offset}px; z-index: ${i}; filter: drop-shadow(1px 0 0 #222) drop-shadow(-1px 0 0 #222) drop-shadow(0 1px 0 #222) drop-shadow(0 -1px 0 #222); cursor: pointer;`;
          img.addEventListener('click', handlePieceClick); // 駒台の駒にもクリックイベント
          wrapper.appendChild(img);
        }
        if (pieceCount > 1) {
          const countSpan = document.createElement('span');
          countSpan.textContent = pieceCount;
          countSpan.style.cssText = `position: absolute; right: 5px; bottom: 2px; z-index: ${pieceCount}; color: white; font-weight: bold; font-size: 1.2rem; text-shadow: 0 0 4px black, 0 0 4px black; pointer-events: none;`;
          wrapper.appendChild(countSpan);
        }
        goteDiv.appendChild(wrapper);
      }
    }
  }

  // ===================================================================
  // 棋譜再生ロジック
  // ===================================================================

  function applyJKFMove(moveObj) {
    if (!moveObj || !moveObj.move) return;
    const move = moveObj.move;
    const turn = move.color === 0 ? 'sente' : 'gote';
    const opponent = move.color === 0 ? 'gote' : 'sente';

    if (move.to && move.piece && !move.from) {
      const toCol = 9 - move.to.x;
      const toRow = move.to.y - 1;
      const pieceType = pieceKeyToType[move.piece];
      if (pieceType) {
        boardState[toRow][toCol] = { type: pieceType, owner: turn };
        hand[turn][move.piece]--;
      }
    } else if (move.from && move.to) {
      const fromCol = 9 - move.from.x;
      const fromRow = move.from.y - 1;
      const toCol = 9 - move.to.x;
      const toRow = move.to.y - 1;
      const pieceOnTarget = boardState[toRow][toCol];
      if (pieceOnTarget && pieceOnTarget.owner === opponent) {
        const baseType = pieceOnTarget.type.replace('_n', '');
        const capturedPieceKey = pieceTypeToKey[baseType];
        if (capturedPieceKey) {
          hand[turn][capturedPieceKey]++;
        }
      }
      const movingPiece = { ...boardState[fromRow][fromCol] };
      if (!movingPiece.type) {
        console.error("動かす駒が見つかりません:", fromRow, fromCol, moveObj);
        return;
      }
      if (move.promote) {
        if (!movingPiece.type.endsWith('_n')) {
          movingPiece.type += '_n';
        }
      }
      boardState[toRow][toCol] = movingPiece;
      boardState[fromRow][fromCol] = null;
    }
  }

  function applyMovesUntil(upTo) {
    resetBoardToInitial();
    for (let i = 1; i <= upTo; i++) {
      const moveObj = jkfMoves[i];
      if (moveObj) applyJKFMove(moveObj);
    }
    currentTurn = (upTo % 2 === 0) ? 'sente' : 'gote';
    drawFullBoard();
    drawHands();
  }

  // ===================================================================
  // 初期化とメインのイベントリスナー
  // ===================================================================

  btnNext.addEventListener('click', () => {
    if (replayCurrent < jkfMoves.length - 1) {
      replayCurrent++;
      applyMovesUntil(replayCurrent);
      updateMoveCounter();
      displayCurrentComment();
      renderMoveList();
      highlightCurrentMoveInList();
    }
  });

  btnBack.addEventListener('click', () => {
    if (replayCurrent > 0) {
      replayCurrent--;
      applyMovesUntil(replayCurrent);
      updateMoveCounter();
      displayCurrentComment();
      highlightCurrentMoveInList();
    }
  });

  const saveBtn = document.getElementById('save-comment-btn');
  saveBtn.addEventListener('click', saveComment);

  setupInitialBoard();
  applyMovesUntil(replayCurrent);
  updateMoveCounter(); 
  loadComments();
  displayCurrentComment();
  highlightCurrentMoveInList();

  document.body.addEventListener('click', (e) => {
    // 盤面や駒台の外側をクリックしたら、選択を解除する
    if (!board.contains(e.target) && 
        !document.getElementById('sente-hand').contains(e.target) &&
        !document.getElementById('gote-hand').contains(e.target)) {
      if (selectedPiece) {
        resetPieceStyle(selectedPiece);
        selectedPiece = null;
        clearHighlights();
      }
    }
  });

  // --- 棋譜リストのクリックイベント ---
  const moveListContainer = document.getElementById('kifu-move-list');
  if (moveListContainer) {
    moveListContainer.addEventListener('click', (e) => {
      // クリックされたのが .move-item 要素か、その子要素かを確認
      const clickedItem = e.target.closest('.move-item');

      if (clickedItem) {
        // data属性からジャンプしたい手数を取得
        const targetMoveNumber = parseInt(clickedItem.dataset.moveNumber, 10);

        // 同じ手数をクリックした場合は何もしない
        if (targetMoveNumber === replayCurrent) {
          return;
        }
        
        // グローバルな手数を更新
        replayCurrent = targetMoveNumber;

        // 盤面と各種表示をすべて更新
        applyMovesUntil(replayCurrent);
        updateMoveCounter();
        displayCurrentComment();
        highlightCurrentMoveInList();
      }
    });
  }

  setupInitialBoard();         // 1. 盤面の基本的な設定
  loadComments();              // 2. ★★★まずコメントデータを読み込む★★★
  renderMoveList();            // 3. ★★★コメントデータを元に棋譜リストを描画★★★
  applyMovesUntil(replayCurrent); // 4. 盤面を初期位置に設定
  updateMoveCounter();         // 5. 手数カウンターを更新
  displayCurrentComment();     // 6. コメント欄を更新
  highlightCurrentMoveInList();  // 7. 棋譜リストのハイライトを更新
});