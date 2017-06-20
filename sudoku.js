var cancelAnimFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame;
var requestAnimFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                       window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

var config = {'boardID': 'sudoku', 'solveID': 'solve', 'clearID': 'clear'};
window.onload = function(){ 
  new Sudoku(config).init() 
};


var Sudoku = function(config){
  this.board = document.getElementById(config.boardID);
  this.solveButton = document.getElementById(config.solveID);
  this.clearButotn;
  this.map = [];
  this.checker = {};
  this.imMut = [];
  this.table;
  this.valid = true;
  this.f = 0;

  if (config.clearID) 
    this.clearButton = document.getElementById(config.clearID);
}

Sudoku.prototype.init = function(){
  var self = this;

  this.buildTable();
  this.listenForChanges();

  this.solveButton.onclick = function(){
    if (!self.valid) return;
    
    self.stopCheck();
    self.isValBoard();
    self.f = [];
    self.map = [];
    self.addImmutVals();
    self.fillMap();
    self.solve();
    console.log(self.f);
    self.updateTable();
  }

  if (this.clearButton){
    this.clearButton.onclick = function(){
      self.clearUp();
    }
  }
};


Sudoku.prototype.stopCheck = function(){
  cancelAnimFrame(this.checker.anim);
  this.checker.id = undefined;
  this.checker.anim = undefined;
}

Sudoku.prototype.clearUp = function(){
  this.imMut = [];
  this.map = [];
  var rows = this.table.rows;

  for (var r = 0; r < rows.length; r++){
    var cols = rows[r].cells;
    for (var c = 0; c < cols.length; c++){
      if (cols[c].firstChild.value)
        cols[c].firstChild.value = null;
    }
  }
}

Sudoku.prototype.updateTable = function(m){
  if (!m) m = this.map
  var rows = this.table.rows;

  for (var r = 0; r < rows.length; r++){
    var cols = rows[r].cells;
    for (var c = 0; c < cols.length; c++){
      if (m[r][c])
        cols[c].firstChild.value = m[r][c];
    }
  }
};

Sudoku.prototype.addImmutVals = function(){
  this.imMut = [];
  var rows = this.table.rows;

  for (var r = 0; r < rows.length; r++){
    var cols = rows[r].cells;
    for (var c = 0; c < cols.length; c++){
      var val = cols[c].firstChild.value;
      if (!val) continue;
      if (isNaN(val)) val = Number(val);
      if (!isNaN(val))
        this.imMut.push({'row': r, 'col': c, 'val': Number(val)});
    }
  }
};

Sudoku.prototype.isMut = function(r, c){
  for (var i = 0; i < this.imMut.length; i++){
    if (this.isMut[i].row == r || this.isMut[i].col == c)
      return false;
  }

  return true;
}
Sudoku.prototype.listenForChanges = function(){
  var rows = this.table.rows, self = this;

  for (var r = 0; r < rows.length; r++){
    var cols = rows[r].cells;
    for (var c = 0; c < cols.length; c++){

      cols[c].firstChild.onfocus = function(e){

        var input = this,
            row = input.parentElement.getAttribute('r'),
            col = input.parentElement.getAttribute('c'),
            curVal = input.value,
            id = row.toString() + col.toString();

        self.stopCheck();
        self.checker.id = id;
        self.checker.anim = requestAnimFrame(checkInScope);

        function checkInScope(){
          if (!input.value) input.value = null;
          if (curVal != input.value){

            var val = isNaN(input.value) ? input.value : input.value.toString();
            if (val == "0") input.value = null;
            if (val == "e") input.value = null;
            if (val.toString().length > 1) input.value = Number(input.value[0]);
            curVal = input.value;
            self.valid = self.isValBoard();
            self.solveButton.disabled = !self.valid;
          }

          if (self.checker.id && self.checker.id == id)
            requestAnimFrame(checkInScope);
        }
      };

      cols[c].firstChild.onblur = function(e){
        self.stopCheck();
      }
    }
  }
}

Sudoku.prototype.complete = function(){
  if (this.map.length < 9) return false;
  for (var r = 0; r < this.map.length; r++){
    if (this.map[r].length < 9) return false;
    for (var c = 0; c < 9; c++)
      if (!this.map[r][c]) return false;
  }

  return true;
}

Sudoku.prototype.buildTable = function(){
  var html = '<table id = "tDub">'
  for (var r = 0; r < 9; r++){
    html += "<tr>";
    for (var c = 0; c < 9; c++){
      html += '<td r = "' + r.toString() + '"';
      html += 'c = "' + c.toString() + '">';
      html += '<input id = "' + r.toString() + ' ' + c.toString() + '"';
      html += 'class = "sN" type = "number" min="1" max="9" name = "num"></td>';
    }
    html += "</tr>";
  }

  this.board.innerHTML = html + "</table>";
  this.table = this.board.firstChild;
}


Sudoku.prototype.solve = function(row, col){
  this.f++;
  if (this.f % 10000 == 0) console.log(Math.floor(this.f/10000));
  if (this.complete()){
    return;
  }
  if (!row) row = 0;
  if (!col) col = 0;
  if (!this.isMut(row, col)){
    var pos = this.newPos(row, col);
    if (pos.row < 9)
      this.solve(pos.row, pos.col);
  }

  for (var i = 1; i < 10; i++){
    if (this.complete()){
      return;
    }
    this.wipeBoard(row, col);

    if (this.valRC(row, col, i) && this.valBlock(row, col, i)){
      this.map[row][col] = i;
      var pos = this.newPos(row, col);
      if (pos.row < 9)
        this.solve(pos.row, pos.col);
    }
  }
  
}

Sudoku.prototype.isDupl = function(iArr, oArr){
  for (var x in oArr){
    if (iArr[0] == oArr[x][0] && iArr[1] == oArr[x][1])
      return true;
  }
  
  return false 
}

Sudoku.prototype.isValBoard = function(){
  //we will find all duplicates
  var dupls = [],
      rows = this.table.rows;

  for (var r = 0; r < rows.length; r++){
    var cells = rows[r].cells;
    for (var c = 0; c < cells.length; c++){

      //we're checking all cells
      var cell = cells[c].firstChild;
          val = cell.value, d = 0, valFail = false;

      if (this.isDupl([r, c], dupls)) continue;

      //check rows and cols
      for (var idx = 0; idx < 9; idx++){

        //don't wanna write this twice
        var colCheck = rows[idx].cells[c].firstChild.value,
            rowCheck = rows[r].cells[idx].firstChild.value;
        
        for (var v = 0; v < 2; v++){
          var cVal = v > 0 ? rowCheck : colCheck,
              cIdx = v > 0 ? [r, idx] : [idx, c],
              br = v > 0 ? c : r;

          //we're a dupl
          if (cVal && br != idx && cVal == val){
            if (!valFail){
              valFail = true;
              if (!this.isDupl([r, c], dupls))
                dupls.push([r, c]);
            }

            if (!this.isDupl(cIdx, dupls))
              dupls.push(cIdx);
          }
        }
      } 

      //start block check
      var row = r,
          col = c;
    
      while (row % 3 !== 0) row--;
      while (col % 3 !== 0) col--;

      for (var y = 0; y < 3; y++){
        for (var x = 0; x < 3; x++){
          var tR = row + y;
              tC = col + x,
              bVal = rows[tR].cells[tC].firstChild.value;
        
          if ((tR == r && tC == c) || !bVal)
            continue;
            
          if (bVal == val){
            if (!valFail){ 
              valFail = true;
              if (!this.isDupl([r, c], dupls))
                dupls.push([r, c])
            }

            if (!this.isDupl([tR, tC], dupls))
              dupls.push([tR, tC]);
          }
        }
      }                 
    }                  
  }

  this.colorCode(dupls);
  return dupls.length < 1;
}

Sudoku.prototype.colorCode = function(dupls){
  var rows = this.table.rows;
  for (var r = 0; r < rows.length; r++){
    var cells = rows[r].cells;
    for (var c = 0; c < cells.length; c++){
      var cell = cells[c].firstChild;
      if (this.isDupl([r, c], dupls))
        cell.style.color = 'red';
      else
        cell.style.color = 'black';
    }
  }
}

Sudoku.prototype.isMut = function(r, c){
  var m = this.imMut

  for (var i = 0; i < m.length; i++)
    if (m[i].row == r && m[i].col == c) return false;

  return true;
}

Sudoku.prototype.wipeBoard = function(row, col){
  if (col === 0){
    this.map = this.map.slice(0, row);
  }else{
    this.map = this.map.slice(0, row + 1);
    this.map[row] = this.map[row].slice(0, col);
  }

  this.fillMap();
}

Sudoku.prototype.fillMap = function(){
  var r = this.map.length;
  while (this.map.length < 9)
    this.map.push([]);

  for (var i = 0; i < this.imMut.length; i++){
    var row = this.imMut[i].row,
        col = this.imMut[i].col;

    this.map[row][col] = this.imMut[i].val;
  }
}

Sudoku.prototype.newPos = function(row, col){
  if (col + 1 > 8){
    col = 0;
    row++;
  }else{
    col++;
  }
  
  return {"row": row, "col": col};
}

Sudoku.prototype.valRC = function(r, c, n){
  for (var idx = 0; idx < 9; idx++){
    if (idx < this.map.length && c < this.map[idx].length && idx != r){
      if (this.map[idx][c] == n) return false;
    }
    
    if (r < this.map.length && idx < this.map[r].length && idx != c){
      if (this.map[r][idx] == n) return false;
    }
  }
  return true;
}

Sudoku.prototype.valBlock = function(r, c, n){
  var row = r,
      col = c;
      
  while (row % 3 !== 0) row--;
  while (col % 3 !== 0) col--;
  
  for (var y = 0; y < 3; y++){
    for (var x = 0; x < 3; x++){
      var tR = row + y;
          tC = col + x;
          
      if (tR == r && tC == c)
        continue;
        
      if (tR < this.map.length && tC < this.map[row].length)
        if (this.map[tR][tC] == n) return false;
      
    }
  }
  
  return true;
}