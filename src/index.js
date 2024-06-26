import invRecordsJOIN from "../data/InvRecordJOIN.json"
import invRecords from "../data/InvRecords.json"
import qbBill from "../data/qbBill.json"
import qbInv from "../data/qbInv.json"

const obj = {
  qbObj: qbBill,
  invRecords: invRecords,
  invRecordsJOIN
}

//ELEMENTS
function createHeader(data) {
  //process and parse data
  const type = extractTypeFromQBData(data) 
  if (!type) {
    console.error('No valid type key found in QueryResponse');
    return; // Exit if no type key found
  } 
  const record = data.QueryResponse[type][0]
  
  //render
  const headerDiv = document.createElement('div');
  headerDiv.className = 'header';
  if(type==="Invoice"){
    headerDiv.innerHTML = `<div class="pb-2 text-3xl">${type} Details</div>
        <div class="flex flex-row mt-2 gap-4">
          <p><strong>Customer:</strong> ${record.CustomerRef.name}</p>
          <p><strong>Doc Number:</strong> ${record.DocNumber}</p>
          <p><strong>Date:</strong> ${record.TxnDate}</p>
          <p><strong>Total Amount:</strong> $${record.TotalAmt}</p>
        </div>`;
    document.getElementById('dataHeader').appendChild(headerDiv);
  } else {
    headerDiv.innerHTML = `<div class="pb-2 text-3xl">${type} Details</div>
        <div class="flex flex-row mt-2 gap-4">
          <p><strong>Customer:</strong> ${record.VendorRef.name}</p>
          <p><strong>Doc Number:</strong> ${record.DocNumber}</p>
          <p><strong>Date:</strong> ${record.TxnDate}</p>
          <p><strong>Total Amount:</strong> $${record.TotalAmt}</p>
        </div>`;
    document.getElementById('dataHeader').appendChild(headerDiv);
  }
}

function createLineItems(data) {
  const type = extractTypeFromQBData(data) 
  if (!type) {
    console.error('No valid type key found in QueryResponse');
    return; // Exit if no type key found
  }
  const items = data.QueryResponse[type][0].Line
  const tableBody = document.getElementById('tableBody');
  if(type==="Invoice"){
    items.forEach(item => {
        // Safely retrieve nested properties
        const id=item.Id
        const description = item.Description ? item.Description :  '|!|';
        const itemName = getNestedProperty(item, ['SalesItemLineDetail', 'ItemRef', 'name'], '|!|').split(':').pop();
        const rawUnitPrice = getNestedProperty(item, ['SalesItemLineDetail', 'UnitPrice'], '|!|');
        const unitPrice = isNaN(parseFloat(rawUnitPrice)) ? '|!|' : parseFloat(rawUnitPrice).toFixed(2);
        const quantity = getNestedProperty(item, ['SalesItemLineDetail', 'Qty'], '|!|');
        const taxCodeRefValue = getNestedProperty(item, ['SalesItemLineDetail', 'TaxCodeRef', 'value'], '|!|');
        const rawAmount = item.Amount || '|!|';
        const amount = isNaN(parseFloat(rawAmount)) ? '|!|' : parseFloat(rawAmount).toFixed(2);

        // Determine tax status based on taxCodeRefValue
        let taxStatus;
        if (taxCodeRefValue === '4') {
            taxStatus = 'GST';
        } else if (taxCodeRefValue === '6') {
            taxStatus = 'OOS';
        } else {
            taxStatus = taxCodeRefValue;
        }

        const row = document.createElement('tr');
        row.id=id
        const isLinked = invRecordsJOIN.some(record => record._qbID === item.qbID && record._qbLineID === item.LineId);
        const linkBlock = isLinked ? `
            <span class="material-icons cursor-pointer" onClick=showInfo(this)>
                link
            </span>` : `
            <span class="material-icons text-yellow-200 opacity-25 hover:opacity-75">
                link_off
            </span>`
        row.innerHTML = `
            <td class="border px-4 py-2 dark:border-gray-500 text-gray-400 text-center">
                ${linkBlock}
            </td>
            <td class="border px-4 py-2 dark:border-gray-500 dark:text-gray-400">${description}</td>
            <td class="border px-4 py-2 dark:border-gray-500 dark:text-gray-400">${itemName}</td>
            <td class="border px-4 py-2 dark:border-gray-500 dark:text-gray-400">$${unitPrice}</td>
            <td class="border px-4 py-2 dark:border-gray-500 dark:text-gray-400">${quantity}</td>
            <td class="border px-4 py-2 dark:border-gray-500 dark:text-gray-400">${taxStatus}</td>
            <td class="border px-4 py-2 dark:border-gray-500 dark:text-gray-400">$${amount}</td>
            <td class="border px-4 py-2 dark:border-gray-500 dark:text-gray-400 text-center">
                <button class="material-icons cursor-pointer opacity-25 hover:opacity-75 text-red-500" onclick="deleteRow(this)">
                    cancel
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    

    });
  } else {
    items.forEach(item => {
        // Safely retrieve nested properties
        const id=item.Id
        const description = item.Description ? item.Description :  '|!|';
        const itemName = getNestedProperty(item, ['AccountBasedExpenseLineDetail', 'AccountRef', 'name'], '|!|').split(':').pop();
        const rawUnitPrice = item.Amount ? item.Amount :  '|!|';
        const unitPrice = isNaN(parseFloat(rawUnitPrice)) ? '|!|' : parseFloat(rawUnitPrice).toFixed(2);
        const quantity = item.Qty ? item.Qty :  1;
        const taxCodeRefValue = getNestedProperty(item, ['AccountBasedExpenseLineDetail', 'TaxCodeRef', 'value'], '|!|');
        //const rawAmount = item.Amount ? item.Amount : '|!|';
        //const amount = isNaN(parseFloat(rawAmount)) ? '|!|' : parseFloat(rawAmount).toFixed(2);

        // Determine tax status based on taxCodeRefValue
        let taxStatus;
        if (taxCodeRefValue === '4') {
            taxStatus = 'GST';
        } else if (taxCodeRefValue === '6') {
            taxStatus = 'OOS';
        } else {
            taxStatus = taxCodeRefValue;
        }
        const rawAmount = taxStatus==='GST' ? unitPrice*1.05:unitPrice
        const amount = isNaN(parseFloat(rawAmount)) ? '|!|' : parseFloat(rawAmount).toFixed(2)


        const row = document.createElement('tr');
        row.id = id
        const isLinked = invRecordsJOIN.some(record => record._qbID === item.qbID && record._qbLineID === item.LineId);
        const linkBlock = isLinked ? `
                        <span class="material-icons cursor-pointer" onClick=showInfo(this)>
                            link
                        </span>` : `
                        <span class="material-icons text-yellow-200 opacity-25 hover:opacity-75">
                            link_off
                        </span>`
        row.innerHTML = `
            <td class="border px-4 py-2 dark:border-gray-500 text-gray-400 text-center">
                ${linkBlock}
            </td>
            <td class="border px-4 py-2 dark:border-gray-500 dark:text-gray-400">${description}</td>
            <td class="border px-4 py-2 dark:border-gray-500 dark:text-gray-400">${itemName}</td>
            <td class="border px-4 py-2 dark:border-gray-500 dark:text-gray-400">$${unitPrice}</td>
            <td class="border px-4 py-2 dark:border-gray-500 dark:text-gray-400">${quantity}</td>
            <td class="border px-4 py-2 dark:border-gray-500 dark:text-gray-400">${taxStatus}</td>
            <td class="border px-4 py-2 dark:border-gray-500 dark:text-gray-400">$${amount}</td>
            <td class="border px-4 py-2 dark:border-gray-500 dark:text-gray-400 text-center">
                <button class="material-icons cursor-pointer opacity-25 hover:opacity-75 text-red-500" onclick="deleteRow(this)">
                    cancel
                </button>
            </td>
        `;
        tableBody.appendChild(row);

    });

  }
}

function addControls() {
  const controlsDiv = document.createElement('div');
  controlsDiv.className = 'controls flex flex-row py-4 gap-2';
  controlsDiv.innerHTML = `
      <button class="py-2 px-4 bg-blue-500 opacity-75 dark:bg-cyan-800 text-white dark:text-gray-300 rounded-md" onclick="sortItems()">Sort</button>
      <button class="py-2 px-4 bg-blue-500 opacity-75 dark:bg-cyan-800 text-white dark:text-gray-300 rounded-md" onclick="findDuplicates()">Find Duplicates</button>
      <button class="py-2 px-4 bg-blue-500 opacity-75 dark:bg-cyan-800 text-white dark:text-gray-300 rounded-md" onclick="showInfo()">Show Info</button>
      <button class="py-2 px-4 bg-blue-500 opacity-75 dark:bg-cyan-800 text-white dark:text-gray-300 rounded-md" onclick="updateItems()">Update</button>`;
  document.getElementById('app').appendChild(controlsDiv);
}

/**
//Dark Mode
document.getElementById('toggleDarkMode').addEventListener('click', function() {
  const icon = this.querySelector('.material-icons');
  console.log({icon})
  const currentTheme = document.body.classList.toggle('dark');

  // Switch the icon based on the theme
  if (currentTheme) {
      icon.textContent = 'brightness_7'; // sun icon for light mode
      console.log('Switched to dark mode');
  } else {
      icon.textContent = 'brightness_4'; // moon icon for dark mode
      console.log('Switched to light mode');
  }
});

// Optional: Automatically set theme based on user preferences or a stored setting
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  // It's a dark theme by user preference
  document.body.classList.add('dark');
  document.getElementById('toggleDarkMode').querySelector('.material-icons').textContent = 'brightness_7';
}
 */


//GLOBAL FUNCTIONS
window.setQbData = function(data) {
  console.log('version', "1.0.0");
  const jsonData = JSON.parse(data);
  console.log({jsonData});
  createHeader(jsonData.qbObj);
  createLineItems(jsonData.qbObj);
  addControls();
  console.log('version', "1.0.0");
}



//FUNCTIONS
function sortFunction() {
  console.log("Sort function called");
  // Implementation of the sort functionality
}

function findDuplicates() {
  console.log("Find duplicates function called");
  // Implementation of finding duplicates
}

function showInfo() {
  console.log("Show info function called");
  // Implementation of showing info
}

function updateData() {
  console.log("Update data function called");
  // Implementation of updating data
}

function extractTypeFromQBData(qbData) {
  const { QueryResponse } = qbData;
  const keys = Object.keys(QueryResponse);
  const nonTypeKeys = ['maxResults', 'startPosition', 'totalCount'];
  const typeKey = keys.find(key => !nonTypeKeys.includes(key));
  return typeKey;
}

function getNestedProperty(object, path, defaultValue) {
  return path.reduce((xs, x) => (xs && xs[x] != null ? xs[x] : defaultValue), object);
}



setQbData(JSON.stringify(obj))
