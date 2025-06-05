export function canMoveFu(fromRow, fromCol, toRow, toCol, boardState, owner) {
  // 盤外判定
  if (toRow < 0 || toRow > 8 || toCol < 0 || toCol > 8) return false;

  // 歩の進行方向決定
  const direction = (owner === 'sente') ? -1 : 1;

  // 移動先が1マス前かチェック
  if (toRow !== fromRow + direction) return false;
  if (toCol !== fromCol) return false;

  // 移動先に自分の駒があるかチェック
  const destCell = boardState[toRow][toCol];
  if (destCell && destCell.owner === owner) return false;

  return true; // 動ける
}