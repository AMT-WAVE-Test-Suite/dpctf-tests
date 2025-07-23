(function (global, factory) {
  typeof exports === "object" && typeof module !== "undefined"
    ? factory(exports, require("global/window"), require("xmldom"))
    : typeof define === "function" && define.amd
    ? define(["exports", "global/window", "xmldom"], factory)
    : ((global = global || self),
      factory((global.segmentAnalyzer = {}), global.window, global.window));
})(this, function (exports) {

    var analyzeSegment = async function analyzeSegment (init, segment, expectedDuration, logger, i, segmentNumber) {
        
        // set start of the segment behind the init
        init.fileStart = 0;
        segment.fileStart = init.byteLength;    
        
        var mp4boxfile = MP4Box.createFile();
        var allSamples = [];
        
        var results = [];
        var reportLog = [];

        let resultFinished = new Promise((resolve) => {
            mp4boxfile.onReady = function (info) {
                for (const track of info.tracks) {
                    mp4boxfile.setExtractionOptions(track.id, null, { nbSamples: Infinity });
                    mp4boxfile.start();
                }

                mp4boxfile.flush();

                setTimeout(() => {
                    for (const track of info.tracks) {
                        if (!allSamples[track.id]) continue;
                        let samples = allSamples[track.id];

                        // aggregate durations of the samples
                        let durationUnits = samples.reduce((acc, cur) => acc + cur.duration, 0);
                        let durationSeconds = durationUnits / track.timescale;

                        let logMsg = `Segment ${i} / ${segmentNumber}: Expected duration (MPD): ${expectedDuration} - Segment duration: ${durationSeconds}`;
                        logger.log(logMsg);
                        reportLog.push(logMsg);

                        if (expectedDuration == durationSeconds) {
                            logger.log(`Segment ${i} / ${segmentNumber} duration correct`);
                            reportLog.push(`Segment ${i} / ${segmentNumber} duration correct`);
                            results.push(true);
                        } else {
                            logger.log(`Segment ${i} / ${segmentNumber} duration incorrect!`);
                            reportLog.push(`Segment ${i} / ${segmentNumber} duration incorrect!`);
                            results.push(false);
                        }
                        if (track.id == info.tracks.length) {
                            resolve();
                        }
                    }
                }, 1);
            };
        });
        

        // write samples to the respective track_id
        mp4boxfile.onSamples = function (track_id, user, samples) {
            if (!allSamples[track_id]) allSamples[track_id] = [];
            allSamples[track_id].push(...samples);
        };

        mp4boxfile.appendBuffer(init);
        mp4boxfile.appendBuffer(segment);

        await resultFinished;
        let toReturn = {results: results, reportLog: reportLog};
        return toReturn;
    }

    exports.analyzeSegment = analyzeSegment;

    Object.defineProperty(exports, "__esModule", { value: true });
});