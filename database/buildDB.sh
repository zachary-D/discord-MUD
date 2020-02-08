#!/bin/bash

if [[ "$1" == "" ]]; then
	echo "Arg1 - Please specify a DB name  to run scripts against"
	exit 1
fi

if [[ "$2" == "" ]]; then
	echo "Arg2 - Please specify a username to authenticate with"
	exit 2
fi

printf "Please enter the DB account password (Leave blank if no password):"
read pass

dbname="$1"
usern="$2"

scriptsAlreadyExecuted=()

if [[ "$3" != "--bootstrap" ]]; then
	#Get list of processed scripts
	set -f
	IFS=$'\n'
	scriptsAlreadyExecuted=( $( echo "select scriptName from updateTracking" | mariadb --batch -h 127.0.0.1 -u$usern "-p$pass" "$dbname" ) )
	#echo ${results[1]}
	echo ${scriptsAlreadyExecuted[@]}
	set +f
else
	#Run as if the DB never existed
	echo "Initializing DB"
	echo "DROP DATABASE IF EXISTS $dbname; CREATE DATABASE $dbname;" | mariadb -h 127.0.0.1 "-u$usern" "-p$pass"
	# echo "" | mariadb -h 127.0.0.1 "-u$usern" "-p$pass"
	echo "Done";
fi




#Logs a script as executed in the DB
function markScriptExecuted ()
{
	echo "insert into updatetracking(scriptName) values('$1')" | mariadb -h 127.0.0.1 "-u$usern" "-p$pass" "$dbname"
}

#Checks if a script was executed, and then executes it if not
function tryExecScript ()
{
	file="$1"

	len="${#scriptsAlreadyExecuted[@]}"
	alreadyRun=False
	
	for (( i=1; i <= $len; i++ )) ; do
		if [[ "${scriptsAlreadyExecuted[$i]}" == "$file" ]]; then
			alreadyRun=True
		fi
	done

	if [[ "$alreadyRun" == False ]]; then
		printf "Executing: $file"
		cat "$file" | mariadb -h 127.0.0.1 "-u$usern" "-p$pass" "$dbname"
		markScriptExecuted "$file"
		echo "...Done!"
	else
		echo "Already executed: $file"
	fi
}

#Process all scripts
for i in *.sql ; do
	tryExecScript "$i";
done