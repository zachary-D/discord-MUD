import * as databaseJS from "database-js";

import * as dbConfig from "../dbConfig.json";

let databaseConnection: databaseJS.Connection;

type procedure = databaseJS.PreparedStatement;

namespace procedures  {
    export let getPlayerById: procedure;
    export let getPlayerByMemberAndGame: procedure;
    export let savePlayer: procedure;
}

//Prepares a statement for a procedure and stores it in 'procedures'
function prepareAndStoreProcedure(procName: string, numVariables: number): void {
    let variableString = "";
    for(let i = 0; i < numVariables; i++) {
        if(i != 0) variableString += ", ";
        variableString += "?";
    }

    procedures[procName] = databaseConnection.prepareStatement(`CALL ${procName}(${variableString})`);
}

function prepareAndStoreAllProcedures() {
}

async function createDatabaseConnection() {
    databaseConnection = new databaseJS.Connection(dbConfig);
}

export async function startup() {
    await createDatabaseConnection();
    prepareAndStoreAllProcedures();
    console.log("Connected to database");
}