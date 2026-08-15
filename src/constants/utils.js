export const getMultipleForQuatityCalculation = (intake) => {
  if (intake?.startsWith('OTHER_')) {
    return parseInt(intake.split('_')[1], 10) || 1
  }

  switch (intake) {
    case 'OD':
      return 1
    case 'QID':
      return 4
    case 'BID':
      return 2
    case 'TID':
      return 3
    case '2OD':
      return 2
    case '2QID':
      return 8
    case '2BID':
      return 4
    case '2TID':
      return 6
    case '2HS':
      return 2
    case 'WO':
      return 1
    case 'WT':
      return 2
    case 'HS':
      return 1
  }

  return 1
}
