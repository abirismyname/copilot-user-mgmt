# Copilot User Report

Retrieve Copilot seat usage for an enterprise or organization.

> Note: **9-Aug-2024** This Action uses the Copilot for Business API, which is in public Beta and subject to change

## PAT Token

- Personal access tokens (classic) need either the `manage_billing:copilot` or `read:enterprise` scopes to use this endpoint. For best compatiblity, the user should be an Enterprise Owner/Admin.

## Usage in workflow

Incorporate the copilot-user-report action into your workflow and initiate the workflow either manually or through a schedule.

Sample workflow 1: Copilot Seat Usage Report for Enterprise

```yaml
  name: Copilot User Report for Enterprise

  on:
    workflow_dispatch:

  jobs:
    first-job:
      runs-on: ubuntu-latest
      
      steps:
      -  uses: abirismyname/copilot-user-report@main
        with:
            GITHUB_TOKEN: ${{ secrets.TOKEN }}
            ent_name: 'octodemo'
            inactive_only: false
            csv_path: data/Copilot-Usage-Report.csv
      -  uses: actions/upload-artifact@v4
        with:
            name: Copilot Usage Report
            path: data/Copilot-Usage-Report.csv     
```

Sample workflow 2: Copilot User Report for Organization

```yaml
  name: Copilot User Management to Report Inactive Users

  on:
    workflow_dispatch:

  jobs:
    first-job:
      runs-on: ubuntu-latest
      
      steps:
      -  uses: abirismyname/copilot-user-report@main
        with:
            GITHUB_TOKEN: ${{ secrets.TOKEN }}
            org_name: 'shundor'
            inactive_only: false
            csv_path: data/Copilot-Usage-Report.csv
      -  uses: actions/upload-artifact@v4
        with:
            name: Copilot Usage Report
            path: data/Copilot-Usage-Report.csv     
```

Sample workflow 3: Email a copy of Enterprise Copilot Seat Usage Report

```yaml
  name: Email a copy of Enterprise Copilot Seat Usage Report

  on:
    workflow_dispatch:

  jobs:
    first-job:
      runs-on: ubuntu-latest
      
      steps:
        -  uses: abirismyname/copilot-user-mgmt@main
          with:
              GITHUB_TOKEN: ${{ secrets.TOKEN }}
              ent_name: 'octodemo'
              inactive_only: false
              csv_path: data/Copilot-Usage-Report.csv
        -  uses: actions/upload-artifact@v4
          with:
              name: Copilot Usage Report
              path: data/Copilot-Usage-Report.csv               
        - uses: dawidd6/action-send-mail@v3
          with:
            server_address: smtp.gmail.com
            server_port: 465
            username: ${{ secrets.EMAIL }}
            password: ${{ secrets.PASSWORD }}
            from: ${{ secrets.EMAIL }}
            to: ${{ secrets.EMAIL }} # Recipient email
            subject: "Copilot User Report"
            html_body: |
              <!DOCTYPE html>
              <html>
              
              <body>
                <h1>Copilot User Report</h1>
                <p>Attached is the Copilot Usage Report Enterprise</p>
                <p>
                  <a href="https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }}#:~:text=Copilot%20Usage%20summary">View the full report on
                    GitHub.com</a>
                </p>

                ${{ steps.pdf.outputs.job-summary-html }}
                
              </body>
              
              </html>
            attachments: "data/Copilot-Usage-Report.csv"   
```
## Parameters

| Name                           | Required  | Description                                                           |
|--------------------------------|------------|----------------------------------------------------------------------|
| GITHUB_TOKEN                 | Yes | PAT Token for access    |
| org_name                       | Yes | GitHub Organization Name                                      |
| csv_path                       | Yes | CSV file path for the Copilot Seat report                          |
| inactive_only                | No  | Generate a report exclusively for inactive users who *Never used Copilot* or *No Activity* yet. The default is set to false. When set to true, only the inactive users who have never used Copilot will be listed. |
| inactive_days               | No  | Generate a report for users who have been inactive for the past n days, with the default value set to 25 days.|

## Exported Fields
Following fields are included in the Copilot Usage Report
- User
- Created At
- Updated At
- Last Activity At
- Last Activity Editor
- Pending Cancellation Date
- Team

## Potential for extension
You can Fork and modify the Actions code to incorporate User management using Teams. Incorporate the [Remove teams from the Copilot subscription for an organization](https://docs.github.com/en/rest/copilot/copilot-user-management?apiVersion=2022-11-28#remove-teams-from-the-copilot-subscription-for-an-organization) API instead of [Remove users from the Copilot subscription for an organization](https://docs.github.com/en/rest/copilot/copilot-user-management?apiVersion=2022-11-28#remove-users-from-the-copilot-subscription-for-an-organization)

## Report
Copilot usage report is added as a build artifact in the workflow. You can download the report from the workflow run page.

## Thanks

Thanks to [ambilykk](https://github.com/ambilykk/) for doing most of the work!

# License

The scripts and documentation in this project are released under the [MIT License](./LICENSE)
