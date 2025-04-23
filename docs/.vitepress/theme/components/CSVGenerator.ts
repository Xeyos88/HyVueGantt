import dayjs from 'dayjs';

export function generateSampleCSV(): string {
  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;
  
  const projectStart = dayjs(`${year}-${month}-10`);
  
  const tasks = [
    {
      id: 1,
      name: "Management System Project",
      startDate: projectStart.format('YYYY-MM-DD HH:mm:ss'),
      endDate: projectStart.add(60, 'day').format('YYYY-MM-DD'),
      progress: 20,
      parentId: "",
      dependencies: ""
    },
    {
      id: 2,
      name: "Requirements Analysis",
      startDate: projectStart.add(1, 'day').format('YYYY-MM-DD'),
      endDate: projectStart.add(10, 'day').format('YYYY-MM-DD'),
      progress: 100,
      parentId: 1,
      dependencies: ""
    },
    {
      id: 3,
      name: "Requirements Documentation",
      startDate: projectStart.add(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
      endDate: projectStart.add(5, 'day').format('YYYY-MM-DD'),
      progress: 100,
      parentId: 2,
      dependencies: ""
    },
    {
      id: 4,
      name: "Stakeholder Interviews",
      startDate: projectStart.add(4, 'day').format('YYYY-MM-DD'),
      endDate: projectStart.add(8, 'day').format('YYYY-MM-DD'),
      progress: 100,
      parentId: 2,
      dependencies: "3"
    },
    {
      id: 5,
      name: "Requirements Approval",
      startDate: projectStart.add(9, 'day').format('YYYY-MM-DD'),
      endDate: projectStart.add(10, 'day').format('YYYY-MM-DD'),
      progress: 100,
      parentId: 2,
      dependencies: "4"
    },
    {
      id: 6,
      name: "Design",
      startDate: projectStart.add(11, 'day').format('YYYY-MM-DD'),
      endDate: projectStart.add(25, 'day').format('YYYY-MM-DD'),
      progress: 80,
      parentId: 1,
      dependencies: "5"
    },
    {
      id: 7,
      name: "System Architecture",
      startDate: projectStart.add(11, 'day').format('YYYY-MM-DD'),
      endDate: projectStart.add(18, 'day').format('YYYY-MM-DD'),
      progress: 100,
      parentId: 6,
      dependencies: "5"
    },
    {
      id: 8,
      name: "Database Design",
      startDate: projectStart.add(19, 'day').format('YYYY-MM-DD'),
      endDate: projectStart.add(23, 'day').format('YYYY-MM-DD'),
      progress: 100,
      parentId: 6,
      dependencies: "7"
    },
    {
      id: 9,
      name: "UI/UX Design",
      startDate: projectStart.add(19, 'day').format('YYYY-MM-DD'),
      endDate: projectStart.add(25, 'day').format('YYYY-MM-DD'),
      progress: 60,
      parentId: 6,
      dependencies: "7"
    },
    {
      id: 10,
      name: "Development",
      startDate: projectStart.add(26, 'day').format('YYYY-MM-DD'),
      endDate: projectStart.add(45, 'day').format('YYYY-MM-DD'),
      progress: 30,
      parentId: 1,
      dependencies: "6"
    },
    {
      id: 11,
      name: "Backend Implementation",
      startDate: projectStart.add(26, 'day').format('YYYY-MM-DD'),
      endDate: projectStart.add(35, 'day').format('YYYY-MM-DD'),
      progress: 50,
      parentId: 10,
      dependencies: "8"
    },
    {
      id: 12,
      name: "Frontend Implementation",
      startDate: projectStart.add(30, 'day').format('YYYY-MM-DD'),
      endDate: projectStart.add(42, 'day').format('YYYY-MM-DD'),
      progress: 30,
      parentId: 10,
      dependencies: "9"
    },
    {
      id: 13,
      name: "API Integration",
      startDate: projectStart.add(36, 'day').format('YYYY-MM-DD'),
      endDate: projectStart.add(45, 'day').format('YYYY-MM-DD'),
      progress: 10,
      parentId: 10,
      dependencies: "11"
    },
    {
      id: 14,
      name: "Testing",
      startDate: projectStart.add(46, 'day').format('YYYY-MM-DD'),
      endDate: projectStart.add(51, 'day').format('YYYY-MM-DD'),
      progress: 0,
      parentId: 1,
      dependencies: "10"
    },
    {
      id: 15,
      name: "Unit Testing",
      startDate: projectStart.add(46, 'day').format('YYYY-MM-DD'),
      endDate: projectStart.add(48, 'day').format('YYYY-MM-DD'),
      progress: 0,
      parentId: 14,
      dependencies: "13"
    },
    {
      id: 16,
      name: "Integration Testing",
      startDate: projectStart.add(49, 'day').format('YYYY-MM-DD'),
      endDate: projectStart.add(50, 'day').format('YYYY-MM-DD'),
      progress: 0,
      parentId: 14,
      dependencies: "15"
    },
    {
      id: 17,
      name: "Acceptance Testing",
      startDate: projectStart.add(51, 'day').format('YYYY-MM-DD'),
      endDate: projectStart.add(51, 'day').format('YYYY-MM-DD'),
      progress: 0,
      parentId: 14,
      dependencies: "16"
    },
    {
      id: 18,
      name: "Deployment",
      startDate: projectStart.add(52, 'day').format('YYYY-MM-DD'),
      endDate: projectStart.add(55, 'day').format('YYYY-MM-DD'),
      progress: 0,
      parentId: 1,
      dependencies: "14"
    },
    {
      id: 19,
      name: "Data Migration",
      startDate: projectStart.add(52, 'day').format('YYYY-MM-DD'),
      endDate: projectStart.add(53, 'day').format('YYYY-MM-DD'),
      progress: 0,
      parentId: 18,
      dependencies: "17"
    },
    {
      id: 20,
      name: "Production Release",
      startDate: projectStart.add(54, 'day').format('YYYY-MM-DD'),
      endDate: projectStart.add(55, 'day').format('YYYY-MM-DD'),
      progress: 0,
      parentId: 18,
      dependencies: "19"
    }
  ];
  

  const header = "id,name,start_date,end_date,progress,parent_id,dependencies";
  
  const rows = tasks.map(task => {
    return `${task.id},"${task.name}",${task.startDate},${task.endDate},${task.progress},${task.parentId},${task.dependencies}`;
  });
  
  return [header, ...rows].join('\n');
}


export function downloadSampleCSV(): void {
  const csvContent = generateSampleCSV();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `gantt-sample-data-${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}