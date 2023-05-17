<template>
  <div class="hello">
    <h1>PRENOTE</h1>

    <label for="prenote1">Prenote 1:</label>
    <input type="file" id="prenote1" @change="handlePrenote1Upload">

    <label for="prenote2">Prenote 2:</label>
    <input type="file" id="prenote2" @change="handlePrenote2Upload">
    <br>
    <button @click="submit">submit</button>
  </div>
</template>

<script>
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default {
  data() {
    return {
      prenote1Contents: '',
      prenote2Contents: '',
    }
  },
  methods: {
    handlePrenote1Upload(event) {
      const file = event.target.files[0]
      const reader = new FileReader()
      reader.onload = () => {
        this.prenote1Contents = reader.result
      }
      reader.readAsText(file)
    },
    handlePrenote2Upload(event) {
      const file = event.target.files[0]
      const reader = new FileReader()
      reader.onload = () => {
        this.prenote2Contents = reader.result
      }
      reader.readAsText(file)
    },

    submit: function () {
      axios.post('http://localhost:5000/prenote', {
        prenote1: this.prenote1Contents,
        prenote2: this.prenote2Contents
      }, {
        responseType: 'blob' // indicate that you are expecting a binary response
      })
        .then(function (response) {
          const csvFile = new Blob([response.data], { type: 'text/csv' });

          const reader = new FileReader();
          reader.onload = function (event) {
            const csvData = event.target.result;

            // Create a new jsPDF instance
            const doc = new jsPDF();

            // Convert the CSV data into an array of arrays
            const rows = csvData.split('\n').map(row => row.split(','));

            // Define the table headers
            const headers = rows.shift();

            // Define the table configuration
            const tableConfig = {
              head: [headers], // Use the headers as the table header
              body: rows,
              styles: { textColor: 'black' },
              alternateRowStyles: { fillColor: '#D3D3D3' }, // Use the remaining rows as the table body

              didDrawCell: (data) => {
                const cellText = data.cell.text;
                const highlightText = 'KALLAX'; // Specify the text to highlight

                if (cellText.includes(highlightText)) {
                  const cellWidth = data.cell.width;
                  const cellHeight = data.cell.height;
                  const cellX = data.cell.x;
                  const cellY = data.cell.y;

                  // Apply the highlight color
                  data.doc.setFillColor('#FFFF00'); // Set the highlight color

                  // Draw a rectangle as the highlight background
                  data.doc.rect(cellX, cellY, cellWidth, cellHeight, 'F');

                  // Add the cell text on top of the rectangle
                  data.doc.text(cellText, cellX, cellY + 5);
                }
              },

            };

            // Generate the table in the PDF document
            doc.autoTable(tableConfig);

            // Save the PDF or open it in a new browser tab
            doc.save('table.pdf');
          };

          reader.readAsText(csvFile);
        })
        .catch(function (error) {
          console.log(error);
        });
    }
  }
}
</script>


<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}
</style>
