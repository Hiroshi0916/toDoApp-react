import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCookies } from 'react-cookie'
import axios from 'axios'
import { Header } from '../components/Header'
import { url } from '../const'
import './home.scss'

export const Home = () => {
  const [filter, setFilter] = useState('all')
  const [isDoneDisplay, setIsDoneDisplay] = useState('todo') // todo->未完了 done->完了
  const [lists, setLists] = useState([])
  const [selectListId, setSelectListId] = useState()
  const [tasks, setTasks] = useState([])
  const [errorMessage, setErrorMessage] = useState('')
  const [cookies] = useCookies()
  const handleIsDoneDisplayChange = (e) => setIsDoneDisplay(e.target.value)
  const [selectTaskIndex, setSelectTaskIndex] = useState(0)

  const filteredLists = lists.filter((list) => {
    switch (filter) {
      case 'private':
        // プライベートリストをフィルタリングするロジックをここに記述
        break
      case 'work':
        // おしごとリストをフィルタリングするロジックをここに記述
        break
      default:
        return true
    }
  })

  useEffect(() => {
    axios
      .get(`${url}/lists`, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((res) => {
        setLists(res.data)
        setSelectListId(res.data[0]?.id)
      })
      .catch((err) => {
        setErrorMessage(`リストの取得に失敗しました。${err}`)
      })
  }, [])

  useEffect(() => {
    const listId = lists[0]?.id
    if (typeof listId !== 'undefined') {
      setSelectListId(listId)
      axios
        .get(`${url}/lists/${listId}/tasks`, {
          headers: {
            authorization: `Bearer ${cookies.token}`,
          },
        })
        .then((res) => {
          setTasks(res.data.tasks)
        })
        .catch((err) => {
          setErrorMessage(`タスクの取得に失敗しました。${err}`)
        })
    }
  }, [lists])

  const handleSelectList = (id) => {
    setSelectListId(id)
    for (let i = 0; i < lists.length; i++) {
      if (lists[i].id === id) {
        setSelectTaskIndex(i)
        break
      }
    }
    axios
      .get(`${url}/lists/${id}/tasks`, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((res) => {
        setTasks(res.data.tasks)
      })
      .catch((err) => {
        setErrorMessage(`タスクの取得に失敗しました。${err}`)
      })
  }

  const handleKeyDown = (e) => {
    if (!lists.length) {
      console.log('Error: lists is empty')
      return
    }

    if (selectTaskIndex < 0 || selectTaskIndex >= lists.length) {
      console.log(`Error: invalid selectTaskIndex ${selectTaskIndex}`)
      return
    }
    let newIndex = selectTaskIndex
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSelectList(lists[selectTaskIndex].id)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      newIndex = (selectTaskIndex + 1) % lists.length
      handleSelectList(lists[newIndex].id)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      newIndex = (selectTaskIndex - 1 + lists.length) % lists.length
      handleSelectList(lists[newIndex].id)
    }
  }

  return (
    <div>
      <Header />
      <main className="taskList">
        <p className="error-message">{errorMessage}</p>
        <div>
          <div className="list-header">
            <h2>リスト一覧</h2>
            <div className="list-menu">
              <p>
                <Link to="/list/new">リスト新規作成</Link>
              </p>
              <p>
                <Link to={`/lists/${selectListId}/edit`}>
                  選択中のリストを編集
                </Link>
              </p>
            </div>
          </div>
          <ul className="list-tab">
            {lists.map((list, key) => {
              const isActive = list.id === selectListId
              return (
                <li
                  key={key}
                  tabIndex={0}
                  role="option"
                  aria-selected={isActive}
                  className={`list-tab-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelectList(list.id)}
                  onKeyDown={(e) => handleKeyDown(e, list.id, key)}
                >
                  {list.title}
                </li>
              )
            })}
          </ul>
          <div className="tasks">
            <div className="tasks-header">
              <h2>タスク一覧</h2>
              <Link to="/task/new">タスク新規作成</Link>
            </div>
            <div className="display-select-wrapper">
              <select
                onChange={handleIsDoneDisplayChange}
                className="display-select"
              >
                <option value="todo">未完了</option>
                <option value="done">完了</option>
              </select>
            </div>
            <Tasks
              tasks={tasks}
              selectListId={selectListId}
              isDoneDisplay={isDoneDisplay}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

// 表示するタスク
const Tasks = (props) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    date.setHours(date.getHours() - 9)
    const formatter = new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Tokyo',
    })

    return formatter.format(date)
  }

  const { tasks, selectListId, isDoneDisplay } = props
  if (tasks === null) return <></>

  const calculateRemainingDays = (deadline) => {
    // 現在の日時を取得
    const now = new Date()
    // システムのタイムゾーンを日本時間に設定
    const nowInTokyo = new Date(
      now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }),
    )
    // 期限の日時を取得
    const limit = new Date(deadline)
    // タスクの期限も日本時間に設定
    const limitInTokyo = new Date(
      limit.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }),
    )
    // 9時間（単位はミリ秒）を引く
    limitInTokyo.setHours(limitInTokyo.getHours() - 9)

    // 期限までの残り時間（ミリ秒）を計算
    const remainingTime = limitInTokyo.getTime() - nowInTokyo.getTime()
    // ミリ秒を日に換算（1日 = 24*60*60*1000 ミリ秒）端数は切り捨て
    const remainingDays = Math.floor(remainingTime / (24 * 60 * 60 * 1000))
    // ミリ秒を時間に換算（1時間 = 60*60*1000 ミリ秒）端数は切り捨て
    const remainingHours = Math.floor(
      (remainingTime % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000),
    )

    return { remainingDays, remainingHours }
  }

  if (isDoneDisplay == 'done') {
    return (
      <ul>
        {tasks
          .filter((task) => {
            return task.done === true
          })
          .map((task, key) => {
            const remainingTime = calculateRemainingDays(task.limit) // ここで remainingTime を定義します
            return (
              <li key={key} className="task-item">
                <Link
                  to={`/lists/${selectListId}/tasks/${task.id}`}
                  className="task-item-link"
                >
                  <span className="task-title">{task.title}</span>
                  <span className="task-status">
                    {task.done ? '完了' : '未完了'}
                  </span>
                  <br />
                  {/* prettier-ignore */}
                  <span className="task-remaining">
                    残り：{remainingTime.remainingDays}日{ }
                    {remainingTime.remainingHours}時間
                  </span>
                </Link>
              </li>
            )
          })}
      </ul>
    )
  }

  return (
    <ul>
      {tasks
        .filter((task) => {
          return task.done === false
        })
        .map((task, key) => {
          const remainingTime = calculateRemainingDays(task.limit)
          return (
            <li key={key} className="task-item">
              <Link
                to={`/lists/${selectListId}/tasks/${task.id}`}
                className="task-item-link"
              >
                <span className="task-title">{task.title}</span>
                <span className="task-status">
                  {task.done ? '完了' : '未完了'}
                </span>
                <br />
                <span className="task-deadline">
                  期限：{formatDate(task.limit)}
                </span>
                {/* prettier-ignore */}
                <span className="task-remaining">
                  残り：{remainingTime.remainingDays}日{ }
                  {remainingTime.remainingHours}時間
                </span>
                <br />
                <br />
              </Link>
            </li>
          )
        })}
    </ul>
  )
}
