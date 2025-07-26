# Workflow for Custom AMT-WAVE-Test-Suite Deployment

## Custom Tests Generation 
All commands shoud executed in directory `dpctf-tests`.

Create a custom test case in HTML format. Place it in the directory `dpctf-test`. 

Afterward configure some contents for the test cases in the csv file `custom_tests.csv`
```csv
"<custom-test-case-name>","<video-test-vector-url>","<audio-test-vector>","<direcotry-in-generated>"
```

Than generate tests with the script `generate-tests.py`. Note that you have to specify the mpd-root-directory.
```bash
$ ./generate-tests.py ./custom_tests.csv ./generated/ ../dpctf-deploy/
```

## Publish Changes
Push the new tests to git repo **dpctf-tests** in branch `master`.
```git
git push
```

## Deploy new Tests
Change to directory `dpctf-deploy`. 

You have to rebuild the Dockerfile with the new tests. Execute this:
```bash
./build.sh --reload-runner --reload-tests --tests-branch master
```

Lastly execute Docker Compose to start the server. 
```bash
docker compose up
```

Access webui via Browser:
```
http://localhost:8000/_wave/index.html
http://localhost:8000/_wave/configuration.html
```