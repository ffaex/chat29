import ago from 's-ago'

export function humanDate(created_at: number): string {
  const d = created_at * 1000
  if (d < Date.now() - 1000 * 60 * 60 * 60 /* 60 hours */)
    return new Date(d).toDateString().split(' ').slice(1,3).join(' ')
  return ago(new Date(d))
}

type GroupData = {
  [userId: string]: string;
};


// TODO make colors from maybe 10 prefined colors
export function getUserColor(groupId: string, userId: string): string {
  const groupData: GroupData = JSON.parse(localStorage.getItem(groupId) || '{}');

  // Check if the user already has a color assigned
  if (groupData[userId]) {
      return groupData[userId];
  }

  let newColor;
  do {
      newColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
  } while (Object.values(groupData).includes(newColor));

  // Assign the new color to the user and update local storage
  groupData[userId] = newColor;
  localStorage.setItem(groupId, JSON.stringify(groupData));

  return newColor;
}

