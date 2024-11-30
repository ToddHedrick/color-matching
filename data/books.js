import pantone_c from "./books/pantone_c.js";
import pantone_cp from "./books/pantone_cp.js";
import pantone_tcx from "./books/pantone_tcx.js";
import pantone_u from "./books/pantone_u.js";
import pantone_up from "./books/pantone_up.js";
import pantone_xgc from "./books/pantone_xgc.js";
import alice_thread from "./books/alice_thread.js";

const books = {
  "ALICE THREAD": {
    "name": "Alice Thread",
    getColors: function (){
      return alice_thread;
    }
  },
  "PANTONE C": {
    "name": "Pantone Solid Coated",
    getColors: function (){
      return pantone_c;
    }
  },
  "PANTONE CP": {
    "name": "Pantone Solid Coated Process",
    getColors: function (){
      return pantone_cp;
    }
  },
  "PANTONE TCX": {
    "name": "Pantone Textile Cotton Extended Range",
    getColors: function (){
      return pantone_tcx;
    }
  },
  "PANTONE U": {
    "name": "Pantone Uncoated",
    getColors: function (){
      return pantone_u;
    }
  },
  "PANTONE UP": {
    "name": "Pantone UncoatedProcess",
    getColors: function (){
      return pantone_up;
    }
  },
  "PANTONE XGC": {
    "name": "Pantone Extended Gamut Coated",
    getColors: function (){
      return pantone_xgc;
    }
  },
};

export default books;