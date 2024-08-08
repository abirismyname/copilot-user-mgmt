// libs for github & graphql
const core = require('@actions/core');
const github = require('@actions/github');
const { parse } = require('json2csv');

// libs for csv file creation
const { dirname } = require("path");
const makeDir = require("make-dir");

// get the octokit handle 
const GITHUB_TOKEN = core.getInput('GITHUB_TOKEN');
const octokit = github.getOctokit(GITHUB_TOKEN);

// inputs defined in action metadata file
const org_Name = core.getInput('org_name');
const ent_Name = core.getInput('ent_name');
const csv_path = core.getInput('csv_path');
//const is_delete = core.getInput('is_delete');
const inactive_only = core.getInput('inactive_only');
const inactive_days = core.getInput('inactive_days');

let totalSeats = 0;
const is_ent = false;
let resource = '';

// Checks if both org_Name and ent_Name are either both provided or both not provided.
if (!org_Name === !ent_Name) {
    core.setFailed('Either org_name or ent_name is required');
    return;
}
// if ent_name is not provided, then it is an org level call
if (!ent_Name) {
    resource = org_Name;
}
else {
    is_ent = true;
    resource = ent_Name;
}

// Our CSV output fields
const fields = [
    {
        label: 'User',
        value: 'assignee.login'
    },
    {
        label: 'Created At',
        value: 'created_at'
    },
    {
        label: 'Updated At',
        value: 'updated_at'
    },
    {
        label: 'Last Activity At',
        value: 'last_activity_at'
    },
    {
        label: 'Last Activity Editor',
        value: 'last_activity_editor'
    },
    {
        label: 'Pending Cancellation Date',
        value: 'pending_cancellation_date'
    },
    {
        label: 'Team',
        value: 'assigning_team.name'
    },
    {
        label: 'Status',
        value: 'status'
    }
];

// Copilot User Management API call
async function getUsage(resource, pageNo) {
    try {
        path = 'GET /enterprises/{ent}/copilot/billing/seats';
        if (!is_ent) {
            path = 'GET /orgs/{org}/copilot/billing/seats'
        }
         
        return await octokit.request(path, {
            org: resource,
            ent: resource,
            page: pageNo,
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });

    } catch (error) {
        core.setFailed(error.message);
    }
}

// Extract Copilot usage data with a pagination of 50 records per page
async function run(resource, csv_path) {

    let addTitleRow = true;
    let pageNo = 1;
    let remainingRecs = 0;

    try {
        await makeDir(dirname(csv_path));
        do {
            // invoke the graphql query execution
            await getUsage(resource, pageNo).then(usageResult => {
                let seatsData = usageResult.data.seats;

                if (addTitleRow) {
                    totalSeats = usageResult.data.total_seats;
                    console.log('Seat Count ' + totalSeats);
                    remainingRecs = totalSeats;
                }

                // pagination to get next page data
                remainingRecs = remainingRecs - seatsData.length;
                console.log('Remaining Records ' + remainingRecs);

                if (inactive_only.toString() === 'true') {
                    // return only the inactive user list
                    seatsData = seatsData.filter(seat => {
                        return !seat.last_activity_at || seat.last_activity_at.trim() === '';
                    });
                }
                else {
                    // return the inactive users and users not active for last n days
                    seatsData = seatsData.filter(seat => {
                        const lastActivityDate = new Date(seat.last_activity_at);
                        const currentDate = new Date();
                        const diffInDays = Math.ceil((currentDate - lastActivityDate) / (1000 * 60 * 60 * 24));
                        return (!seat.last_activity_at || seat.last_activity_at.trim() === '') || (diffInDays >= inactive_days);
                    });
                }

                // ALERT! - create our updated opts
                const opts = { fields, "header": addTitleRow };

                seatsData.forEach(seat => { seat.status = 'pending_cancellation'; });
                // append to the existing file (or create and append if needed)
                require("fs").appendFileSync(csv_path, `${parse(seatsData, opts)}\n`);

                if (remainingRecs > 0) {
                    pageNo = pageNo + 1;
                    addTitleRow = false;
                }

            });
        } while (remainingRecs > 0);
    } catch (error) {
        core.setFailed(error.message);
    }
}

console.log(`preamble: is_ent: ${is_ent}, name: ${resource} `);

// run the action code
run(resource, csv_path);
