#!/bin/bash
function copyFromDirectoryIfMissing()
{
    mkdir -p "$2"
    for i in $( ls -a -I. -I.. "$1" ); do
        if [[ -d "$1/$i" ]]; then
            echo "Recursing into $1/$i"
            copyFromDirectoryIfMissing "$1/$i" "$2/$i" "$3"
            echo "Done recursing."
        elif [[ ! -f "$2/$i" || "$3" == "--replace" ]]; then
            cp "$1/$i" ./"$2/$i"
        else
            echo "$i already exists"
        fi
    done
}

npm install discord.js @types/node typescript ts-node database-js database-js-mysql

copyFromDirectoryIfMissing "template-configs" "./"