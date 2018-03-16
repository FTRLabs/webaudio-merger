#!/bin/bash

segmentTime=$1 # eg 60, for 1 min segments

outDir="./split-audio-${segmentTime}"

mkdir -p $outDir

for trmName in `ls audio/ | grep "ch[1-8].aac$" | sed 's#_ch[1-8].aac##' | sort -u`; do 
	for ch in `seq 1 8`; do
		inFile="./audio/${trmName}_ch${ch}.aac"
		outFile="${outDir}/${trmName}_%03d_ch${ch}.aac"
		echo "--> $inFile -> $outFile"
		ffmpeg -i ${inFile} -map 0 -c copy -f segment -segment_time $segmentTime $outFile
	done
done

