import dayjs from 'dayjs';

interface JIRAIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description: string;
    issuetype: {
      name: string;
      iconUrl: string;
    };
    created: string;
    updated: string;
    duedate: string;
    status: {
      name: string;
    };
    priority?: {
      name: string;
    };
    assignee?: {
      displayName: string;
    };
    parent?: {
      id: string;
      key: string;
    };
    subtasks?: JIRAIssue[];
    issuelinks?: Array<{
      type: {
        name: string;
        inward: string;
        outward: string;
      };
      inwardIssue?: {
        id: string;
        key: string;
      };
      outwardIssue?: {
        id: string;
        key: string;
      };
    }>;
  };
}

interface JIRAData {
  expand: string;
  startAt: number;
  maxResults: number;
  total: number;
  issues: JIRAIssue[];
}

export function generateSampleJIRA(): JIRAData {
  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;
  
  const projectStart = dayjs(`${year}-${month}-01`);
  
  const assignees = [
    "Mario Rossi",
    "Laura Bianchi",
    "Giuseppe Verdi",
    "Sofia Russo",
    "Marco Ferrari",
    "Anna Santini",
    "Carla Esposito",
    "Roberto Ricci"
  ];
  
  const jiraData: JIRAData = {
    "expand": "schema,names",
    "startAt": 0,
    "maxResults": 100,
    "total": 12,
    "issues": [
      {
        "id": "10001",
        "key": "PROJ-1",
        "fields": {
          "summary": "E-commerce Project",
          "description": "Implementation of a complete e-commerce platform",
          "issuetype": {
            "name": "Epic",
            "iconUrl": "https://example.com/epic.png"
          },
          "created": projectStart.format("YYYY-MM-DD"),
          "updated": projectStart.format("YYYY-MM-DD"),
          "duedate": projectStart.add(60, "day").format("YYYY-MM-DD"),
          "status": {
            "name": "In Progress"
          },
          "priority": {
            "name": "High"
          },
          "assignee": {
            "displayName": assignees[0]
          }
        }
      },
      {
        "id": "10002",
        "key": "PROJ-2",
        "fields": {
          "summary": "Requirements Analysis",
          "description": "Gathering and analysis of requirements for the e-commerce platform",
          "issuetype": {
            "name": "Story",
            "iconUrl": "https://example.com/story.png"
          },
          "created": projectStart.add(1, "day").format("YYYY-MM-DD"),
          "updated": projectStart.add(5, "day").format("YYYY-MM-DD"),
          "duedate": projectStart.add(10, "day").format("YYYY-MM-DD"),
          "status": {
            "name": "Done"
          },
          "priority": {
            "name": "High"
          },
          "assignee": {
            "displayName": assignees[1]
          },
          "parent": {
            "id": "10001",
            "key": "PROJ-1"
          },
          "issuelinks": [
            {
              "type": {
                "name": "Blocks",
                "inward": "is blocked by",
                "outward": "blocks"
              },
              "outwardIssue": {
                "id": "10003",
                "key": "PROJ-3"
              }
            }
          ]
        }
      },
      {
        "id": "10003",
        "key": "PROJ-3",
        "fields": {
          "summary": "Database Design",
          "description": "Definition of the database schema for the e-commerce platform",
          "issuetype": {
            "name": "Task",
            "iconUrl": "https://example.com/task.png"
          },
          "created": projectStart.add(11, "day").format("YYYY-MM-DD") + "T08:00:00.000+0000",
          "updated": projectStart.add(15, "day").format("YYYY-MM-DD") + "T17:30:00.000+0000",
          "duedate": projectStart.add(20, "day").format("YYYY-MM-DD"),
          "status": {
            "name": "Done"
          },
          "priority": {
            "name": "Medium"
          },
          "assignee": {
            "displayName": assignees[2]
          },
          "parent": {
            "id": "10001",
            "key": "PROJ-1"
          }
        }
      },
      {
        "id": "10004",
        "key": "PROJ-4",
        "fields": {
          "summary": "Frontend Implementation",
          "description": "Development of the user interface for the e-commerce platform",
          "issuetype": {
            "name": "Story",
            "iconUrl": "https://example.com/story.png"
          },
          "created": projectStart.add(21, "day").format("YYYY-MM-DD") + "T08:00:00.000+0000",
          "updated": projectStart.add(25, "day").format("YYYY-MM-DD") + "T11:45:00.000+0000",
          "duedate": projectStart.add(35, "day").format("YYYY-MM-DD"),
          "status": {
            "name": "In Progress"
          },
          "priority": {
            "name": "High"
          },
          "assignee": {
            "displayName": assignees[3]
          },
          "parent": {
            "id": "10001",
            "key": "PROJ-1"
          },
          "subtasks": [
            {
              "id": "10005",
              "key": "PROJ-5",
              "fields": {
                "summary": "Home Page Implementation",
                "description": "Development of the e-commerce site home page",
                "issuetype": {
                  "name": "Sub-task",
                  "iconUrl": "https://example.com/subtask.png"
                },
                "created": projectStart.add(21, "day").format("YYYY-MM-DD") + "T08:00:00.000+0000",
                "updated": projectStart.add(25, "day").format("YYYY-MM-DD") + "T09:15:00.000+0000",
                "duedate": projectStart.add(27, "day").format("YYYY-MM-DD"),
                "status": {
                  "name": "Done"
                },
                "priority": {
                  "name": "Medium"
                },
                "assignee": {
                  "displayName": assignees[3]
                }
              }
            },
            {
              "id": "10006",
              "key": "PROJ-6",
              "fields": {
                "summary": "Product Page Implementation",
                "description": "Development of the product detail page",
                "issuetype": {
                  "name": "Sub-task",
                  "iconUrl": "https://example.com/subtask.png"
                },
                "created": projectStart.add(27, "day").format("YYYY-MM-DD") + "T08:00:00.000+0000",
                "updated": projectStart.add(29, "day").format("YYYY-MM-DD") + "T14:20:00.000+0000",
                "duedate": projectStart.add(35, "day").format("YYYY-MM-DD"),
                "status": {
                  "name": "In Progress"
                },
                "priority": {
                  "name": "Medium"
                },
                "assignee": {
                  "displayName": assignees[4]
                }
              }
            }
          ]
        }
      },
      {
        "id": "10007",
        "key": "PROJ-7",
        "fields": {
          "summary": "Backend Implementation",
          "description": "Development of APIs and business logic",
          "issuetype": {
            "name": "Story",
            "iconUrl": "https://example.com/story.png"
          },
          "created": projectStart.add(21, "day").format("YYYY-MM-DD") + "T08:00:00.000+0000",
          "updated": projectStart.add(30, "day").format("YYYY-MM-DD") + "T16:10:00.000+0000",
          "duedate": projectStart.add(40, "day").format("YYYY-MM-DD"),
          "status": {
            "name": "In Progress"
          },
          "priority": {
            "name": "High"
          },
          "assignee": {
            "displayName": assignees[2]
          },
          "parent": {
            "id": "10001",
            "key": "PROJ-1"
          },
          "subtasks": [
            {
              "id": "10008",
              "key": "PROJ-8",
              "fields": {
                "summary": "Product APIs",
                "description": "Implementation of APIs for managing products",
                "issuetype": {
                  "name": "Sub-task",
                  "iconUrl": "https://example.com/subtask.png"
                },
                "created": projectStart.add(21, "day").format("YYYY-MM-DD") + "T08:00:00.000+0000",
                "updated": projectStart.add(30, "day").format("YYYY-MM-DD") + "T11:30:00.000+0000",
                "duedate": projectStart.add(32, "day").format("YYYY-MM-DD"),
                "status": {
                  "name": "Done"
                },
                "priority": {
                  "name": "Medium"
                },
                "assignee": {
                  "displayName": assignees[2]
                }
              }
            },
            {
              "id": "10009",
              "key": "PROJ-9",
              "fields": {
                "summary": "Order APIs",
                "description": "Implementation of APIs for managing orders",
                "issuetype": {
                  "name": "Sub-task",
                  "iconUrl": "https://example.com/subtask.png"
                },
                "created": projectStart.add(32, "day").format("YYYY-MM-DD") + "T08:00:00.000+0000",
                "updated": projectStart.add(35, "day").format("YYYY-MM-DD") + "T09:45:00.000+0000",
                "duedate": projectStart.add(40, "day").format("YYYY-MM-DD"),
                "status": {
                  "name": "In Progress"
                },
                "priority": {
                  "name": "Medium"
                },
                "assignee": {
                  "displayName": assignees[5]
                }
              }
            }
          ]
        }
      },
      {
        "id": "10010",
        "key": "PROJ-10",
        "fields": {
          "summary": "Testing and Quality Assurance",
          "description": "Functional and performance testing of the platform",
          "issuetype": {
            "name": "Story",
            "iconUrl": "https://example.com/story.png"
          },
          "created": projectStart.add(41, "day").format("YYYY-MM-DD") + "T08:00:00.000+0000",
          "updated": projectStart.add(41, "day").format("YYYY-MM-DD") + "T15:20:00.000+0000",
          "duedate": projectStart.add(50, "day").format("YYYY-MM-DD"),
          "status": {
            "name": "To Do"
          },
          "priority": {
            "name": "High"
          },
          "assignee": {
            "displayName": assignees[6]
          },
          "parent": {
            "id": "10001",
            "key": "PROJ-1"
          },
          "issuelinks": [
            {
              "type": {
                "name": "Depends",
                "inward": "is depended on by",
                "outward": "depends on"
              },
              "inwardIssue": {
                "id": "10004",
                "key": "PROJ-4"
              }
            },
            {
              "type": {
                "name": "Depends",
                "inward": "is depended on by",
                "outward": "depends on"
              },
              "inwardIssue": {
                "id": "10007",
                "key": "PROJ-7"
              }
            }
          ]
        }
      },
      {
        "id": "10011",
        "key": "PROJ-11",
        "fields": {
          "summary": "Production Deployment",
          "description": "Release of the platform to production environment",
          "issuetype": {
            "name": "Story",
            "iconUrl": "https://example.com/story.png"
          },
          "created": projectStart.add(51, "day").format("YYYY-MM-DD") + "T08:00:00.000+0000",
          "updated": projectStart.add(51, "day").format("YYYY-MM-DD") + "T10:00:00.000+0000",
          "duedate": projectStart.add(55, "day").format("YYYY-MM-DD"),
          "status": {
            "name": "To Do"
          },
          "priority": {
            "name": "Highest"
          },
          "assignee": {
            "displayName": assignees[7]
          },
          "parent": {
            "id": "10001",
            "key": "PROJ-1"
          },
          "issuelinks": [
            {
              "type": {
                "name": "Depends",
                "inward": "is depended on by",
                "outward": "depends on"
              },
              "inwardIssue": {
                "id": "10010",
                "key": "PROJ-10"
              }
            }
          ]
        }
      },
      {
        "id": "10012",
        "key": "PROJ-12",
        "fields": {
          "summary": "Final Review and Launch",
          "description": "Final review of the project and official launch",
          "issuetype": {
            "name": "Task",
            "iconUrl": "https://example.com/task.png"
          },
          "created": projectStart.add(56, "day").format("YYYY-MM-DD") + "T08:00:00.000+0000",
          "updated": projectStart.add(56, "day").format("YYYY-MM-DD") + "T08:00:00.000+0000",
          "duedate": projectStart.add(60, "day").format("YYYY-MM-DD"),
          "status": {
            "name": "To Do"
          },
          "priority": {
            "name": "Highest"
          },
          "assignee": {
            "displayName": assignees[0]
          },
          "parent": {
            "id": "10001",
            "key": "PROJ-1"
          },
          "issuelinks": [
            {
              "type": {
                "name": "Depends",
                "inward": "is depended on by",
                "outward": "depends on"
              },
              "inwardIssue": {
                "id": "10011",
                "key": "PROJ-11"
              }
            }
          ]
        }
      }
    ]
  };
  
  
  jiraData.total = jiraData.issues.length;
  
  return jiraData;
}


export function downloadSampleJIRA(): void {
  const jiraData = generateSampleJIRA();
  const jsonString = JSON.stringify(jiraData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `jira-sample-data-${new Date().toISOString().slice(0, 10)}.json`);
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}