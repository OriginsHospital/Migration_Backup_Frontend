import React, { useState, useEffect, useRef } from 'react'
import { Checkbox, Button, Popover } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

const TreeItem = ({ item, level, parentId, onCheck, checked }) => {
  const [isOpen, setIsOpen] = useState(false)
  const anchorRef = useRef(null)

  const handleToggle = event => {
    event.stopPropagation()
    setIsOpen(prev => !prev)
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  const handleCheck = event => {
    event.stopPropagation()
    onCheck(item.id)
  }

  return (
    <div className={`ml-${level * 4} mb-2`}>
      <div className="flex items-center">
        <Checkbox
          checked={checked[item.id] === true}
          indeterminate={checked[item.id] === 'indeterminate'}
          onChange={handleCheck}
          onClick={event => event.stopPropagation()}
          className="mr-2"
        />
        {item.children ? (
          <>
            <Button
              ref={anchorRef}
              variant="outlined"
              onClick={handleToggle}
              endIcon={<ExpandMoreIcon />}
              className="min-w-[120px] justify-between"
            >
              {item.label}
            </Button>
            <Popover
              open={isOpen}
              anchorEl={anchorRef.current}
              onClose={handleClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              onClick={event => event.stopPropagation()}
            >
              <div className="p-2">
                {item.children.map(child => (
                  <TreeItem
                    key={child.id}
                    item={child}
                    level={level + 1}
                    parentId={item.id}
                    onCheck={onCheck}
                    checked={checked}
                  />
                ))}
              </div>
            </Popover>
          </>
        ) : (
          <span className="text-gray-800">{item.label}</span>
        )}
      </div>
    </div>
  )
}

const TreeDropdown = ({ items }) => {
  const [checked, setChecked] = useState({})
  const wrapperRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        // This will trigger a re-render of all TreeItems, closing all popovers
        setChecked(prev => ({ ...prev }))
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleCheck = id => {
    const newChecked = { ...checked }

    const checkChildren = (items, isChecked) => {
      items.forEach(item => {
        newChecked[item.id] = isChecked
        if (item.children) {
          checkChildren(item.children, isChecked)
        }
      })
    }

    const isChecked = !checked[id]
    newChecked[id] = isChecked

    const item = findItemById(items, id)
    if (item && item.children) {
      checkChildren(item.children, isChecked)
    }

    updateParentCheckState(items, id, newChecked)

    setChecked(newChecked)
  }

  const findItemById = (items, id) => {
    for (const item of items) {
      if (item.id === id) return item
      if (item.children) {
        const found = findItemById(item.children, id)
        if (found) return found
      }
    }
    return null
  }

  const updateParentCheckState = (items, childId, newChecked) => {
    const updateParent = parentItem => {
      if (!parentItem.children) return

      const allChecked = parentItem.children.every(
        child => newChecked[child.id],
      )
      const someChecked = parentItem.children.some(
        child => newChecked[child.id],
      )

      if (allChecked) {
        newChecked[parentItem.id] = true
      } else if (someChecked) {
        newChecked[parentItem.id] = 'indeterminate'
      } else {
        newChecked[parentItem.id] = false
      }
    }

    const findParentAndUpdate = (currentItems, targetId) => {
      for (const item of currentItems) {
        if (
          item.children &&
          item.children.some(child => child.id === targetId)
        ) {
          updateParent(item)
          return item.id
        }
        if (item.children) {
          const parentId = findParentAndUpdate(item.children, targetId)
          if (parentId) {
            updateParent(item)
            return item.id
          }
        }
      }
      return null
    }

    findParentAndUpdate(items, childId)
  }

  return (
    <div ref={wrapperRef} className="p-4">
      {items.map(item => (
        <TreeItem
          key={item.id}
          item={item}
          level={0}
          parentId={null}
          onCheck={handleCheck}
          checked={checked}
        />
      ))}
    </div>
  )
}

export default TreeDropdown

// const items = [
//   {
//     id: '1',
//     label: 'Parent 1',
//     children: [
//       { id: '1-1', label: 'Child 1-1' },
//       { id: '1-2', label: 'Child 1-2',

//         children: [
//           { id: '1-1-1', label: 'Child 11-1' },
//           { id: '1-1-2', label: 'Child 11-2' },
//         ],
//        },
//     ],
//   },
//   {
//     id: '2',
//     label: 'Parent 2',
//     children: [
//       { id: '2-1', label: 'Child 2-1' },
//       {
//         id: '2-2',
//         label: 'Child 2-2',
//         children: [
//           { id: '2-2-1', label: 'Grandchild 2-2-1' },
//         ],
//       },
//     ],
//   },
// ];
