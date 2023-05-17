const csv = require('csv-parser');
const Papa = require('papaparse');
const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const fs = require('fs');

const app = express();
const port = 5000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

app.post('/prenote', function (req, res) {
  const prenote1Contents = req.body.prenote1;
  const prenote2Contents = req.body.prenote2;

  if (prenote1Contents.length != 0 && prenote2Contents.length != 0) {

    // Parse the prenote contents into CSV objects
    const prenote1 = Papa.parse(prenote1Contents, { header: true }).data;
    const prenote2 = Papa.parse(prenote2Contents, { header: true }).data;

    // Create dictionaries to store the rows by ARTNO
    const dict1 = {};
    const dict2 = {};

    // Separate the header from the rest of the rows
    const header = ['ARTNO', ...Object.keys(prenote1[0])];
    const rows1 = [header, ...prenote1];
    const rows2 = [header, ...prenote2];

    // Store rows from prenote1 in dict1
    for (const row of rows1) {
      if (row) {
        const artno = row['ARTNO'];
        dict1[artno] = row;
      }
    }

    // Store rows from prenote2 in dict2
    for (const row of rows2) {
      if (row) {
        const artno = row['ARTNO'];
        dict2[artno] = row;
      }
    }

    // Find the differences between the two files
    const diff = [];
    for (const artno in dict1) {
      if (!(artno in dict2)) {
        diff.push(dict1[artno]);
      } else if (!isRowsEqual(dict1[artno], dict2[artno])) {
        diff.push(dict1[artno]);
      }
    }
    for (const artno in dict2) {
      if (!(artno in dict1)) {
        diff.push(dict2[artno]);
      }
    }

    const evenList = [];
    const oddList = [];

    diff.sort((a, b) => {
      const aDigits = parseInt(a["SLID_P"].toString().slice(0, 2), 10);
      const bDigits = parseInt(b["SLID_P"].toString().slice(0, 2), 10);
      return aDigits - bDigits;
    });


    // this needs to apply all filters (flowtype, salesarea, etc)
    
    // for (let i = 0; i < diff.length; i++) {
    //   const value = parseInt(diff[i]["SLID_P"].toString().slice(0, 2), 10);
    //   if (value % 2 === 0) {
    //     evenList.push(diff[i]);
    //   } else {
    //     oddList.push(diff[i]);
    //   }
    // }

    
    for (let i = 0; i < diff.length; i++) {
      const value = parseInt(diff[i]["SLID_P"].toString().slice(0, 2), 10);
      if (value % 2 === 0) {
        evenList.push(diff[i]);
      } else {
        oddList.push(diff[i]);
      }
    }


    const updatedDiff = [...diff];

    console.log(evenList);
    console.log(oddList);

    const updatedDiffCSV = Papa.unparse(updatedDiff)
    // Convert the diff rows back to a CSV string

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="diff.csv"'
    });

    // Send the CSV string in the response body
    res.send(updatedDiffCSV);


  } else {
    console.log("Prenote missing");
    res.send("Error - please provide all required documents")
  }
});

// Check if two rows are equal, ignoring the ARTNO column
function isRowsEqual(row1, row2) {
  const keys1 = Object.keys(row1).filter(key => key !== 'ARTNO');
  const keys2 = Object.keys(row2).filter(key => key !== 'ARTNO');
  if (keys1.length !== keys2.length) {
    return false;
  }
  for (const key of keys1) {
    if (row1[key] !== row2[key]) {
      return false;
    }
  }
  return true;
}

app.listen(port, 'localhost', () => {
  console.log(`Server listening on http://localhost:${port}`);
});
