import * as databaseJS from "database-js";
import * as _fs from "fs";
const fs = _fs.promises;
import * as path from "path";

import * as dbConfig from "../dbConfig.json";

//Starts up the query manager, loads all queries from the query folder
export async function startup() {
    await queryManager.loadAllQueriesFromFolder(dbConfig.queryFolder);
}

namespace queryManager {
    let databaseConnection = new databaseJS.Connection(dbConfig.connection);

    //All query files loaded and prepared
    export const queryCache = new Map<string, databaseJS.PreparedStatement>();

    //Loads all the files from `path` into `stingCache`
    export async function loadAllQueriesFromFolder(path : string) : Promise<void> {
        const files = await fs.readdir(path);
        await Promise.all(files.map( (f) => {
            if(f.toLowerCase().endsWith(".sql") == false) return;   //Ignore non-queries
            return loadQueryFile(`${path}/${f}`);
        }));
    }

    //Loads the query at `file`, strips all blank space, and stores it in `queryCache`
    async function loadQueryFile(filename : string) : Promise<void> {
        let str = await fs.readFile(filename, {encoding: 'utf-8'});

        //Replace all tabs, spaces, newlines, etc. with a single space
        //Adapted from https://stackoverflow.com/questions/1981349/regex-to-replace-multiple-spaces-with-a-single-space
        str = str.replace(/(\s\s+)|\n/g, ' ');

        let key : string = path.basename(filename.toLowerCase(), ".sql");

        queryCache.set(key, databaseConnection.prepareStatement(str));

        console.log(`Loaded ${filename} as ${key}`);
        console.log(`Query: ${str}`);
    }
}

//Returns a prepared query for the given file (loaded from the string cache, the file is expected to be loaded beforehand)
export function getQuery(filename : string) : databaseJS.PreparedStatement {
    let statement = queryManager.queryCache.get(filename.toLowerCase());
    if(statement == undefined) throw new Error("Prepared query not found!");
    return statement;
}