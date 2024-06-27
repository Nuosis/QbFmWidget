import {updateRecord} from './updateRecord'

async function createRecord(token, params, layout, returnRecord) {
    // console.log("FileMaker_createRecord called")
    // Prepare the data for the API call
    const bodyData = {
        method: "createRecord",
        server: "server.claritybusinesssolutions.ca",
        database: "clarityData",
        layout,
        params
    };

    try {
        const response = await fetch('https://server.claritybusinesssolutions.ca:4343/clarityData', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(bodyData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();

        let recordID = ""
        // Check if the response indicates success
        if (responseData.messages && responseData.messages[0].code === "0") {
            // console.log("Record created successfully", responseData.response);
            recordID = responseData.response.recordId;
            const params = {fieldData: {"~dapiRecordID": recordID}}

            const updateData = await updateRecord(token, params, layout, recordID)
            // console.log('updateResponse: ',{updateData})
            // Check if the response threw error
            if (updateData.messages && responseData.messages[0].code !== "0") {
                throw new Error(`Failed to create record: ${updateData.messages[0].message}`);
            }
        } else {
            throw new Error(`Failed to create record: ${responseData.messages[0].message}`);
        }

        if(returnRecord){
            // console.log('returningRecord')
            const query = [
                {"~dapiRecordID": recordID}
            ];
            const findParams = {
                method: "findRecord",
                server: "server.claritybusinesssolutions.ca",
                database: "clarityData",
                layout,
                params: {query},
            };

            const response = await fetch('https://server.claritybusinesssolutions.ca:4343/clarityData', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(findParams),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            // console.log('findSuccess')

            const findData = await response.json();

            // Check if the response indicates success
            if (findData.messages && findData.messages[0].code === "0") {
                return findData
            } else {
                throw new Error(`Failed to find created record: ${findData.messages[0].message}`);
            }
        } else {
            return responseData
        }


    } catch (error) {
        console.error("Error in creation process: ", error.message);
        throw error; // Rethrow the error to be handled by the caller
    }
}

            // update party.~dapiRecordID in FileMaker with reported recordID

export { createRecord };
