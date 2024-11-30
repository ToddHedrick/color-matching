import pantone_c from "./books/pantone_c.js";
import pantone_cp from "./books/pantone_cp.js";
import pantone_tcx from "./books/pantone_tcx.js";
import pantone_u from "./books/pantone_u.js";
import pantone_up from "./books/pantone_up.js";
import pantone_xgc from "./books/pantone_xgc.js";
import alice_thread from "./books/alice_thread.js";

const books = {
  "ALICE THREAD": {
    "id": "ALICE THREAD",
    "name": "Alice Thread",
    "prefix": "ALICE THREAD",
    getColors: function (){
      return alice_thread;
    }
  },
  "PANTONE C": {
    "id": "PANTONE C",
    "name": "Pantone Solid Coated",
    "prefix": "PANTONE",
    getColors: function (){
      return pantone_c;
    }
  },
  "PANTONE CP": {
    "id": "PANTONE CP",
    "name": "Pantone Solid Coated Process",
    "prefix": "PANTONE",
    getColors: function (){
      return pantone_cp;
    }
  },
  "PANTONE TCX": {
    "id": "PANTONE TCX",
    "name": "Pantone Textile Cotton Extended Range",
    "prefix": "PANTONE",
    getColors: function (){
      return pantone_tcx;
    }
  },
  "PANTONE U": {
    "id": "PANTONE U",
    "name": "Pantone Uncoated",
    "prefix": "PANTONE",
    getColors: function (){
      return pantone_u;
    }
  },
  "PANTONE UP": {
    "id": "PANTONE UP",
    "name": "Pantone Uncoated Process",
    "prefix": "PANTONE",
    getColors: function (){
      return pantone_up;
    }
  },
  "PANTONE XGC": {
    "id": "PANTONE XGC",
    "name": "Pantone Extended Gamut Coated",
    "prefix": "PANTONE",
    getColors: function (){
      return pantone_xgc;
    }
  },
};

export default books;