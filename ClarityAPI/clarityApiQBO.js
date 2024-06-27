// clarityApiQBO.js
import { config } from '../.env.js';

export async function queryQBO(table,query) {
  console.log("queryQBO called ...")
    const url = 'https://server.claritybusinesssolutions.ca:4343/qbo';
    const data = {
        method: "queryQBO",
        params: {
            table, //ie Invoices
            query /*  query: {
                        field: "DocNumber",
                        "operator":"=",
                        value: "202406001"
                      }  */
        }
    };
    // console.log("queryData",data)

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.NODE_TOKEN}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error querying QBO:', error);
        throw error;
    }
}
