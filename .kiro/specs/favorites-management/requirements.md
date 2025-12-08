# Requirements Document

## Introduction

本文档定义了"我的收藏"功能的需求规范。该功能允许用户收藏、管理和查看来自不同来源的面试问题和答案，包括知识库问题、简历解读问答，以及用户自定义问题。系统支持标签分类、Markdown渲染、AI生成答案和流式输出，为用户提供高效的面试准备工具。

## Glossary

- **Favorites System**: 我的收藏系统，用户管理收藏内容的核心模块
- **Question Item**: 问题条目，包含问题文本、答案、标签、来源等信息的数据单元
- **Tag**: 标签，用于分类和组织问题的关键词标识
- **Source Type**: 来源类型，标识问题来自知识库(knowledge)、简历解读(resume)或自定义(custom)
- **Stream Output**: 流式输出，AI生成答案时逐步返回内容的技术方式
- **Markdown Renderer**: Markdown渲染器，使用towxml组件将Markdown文本转换为富文本显示
- **DeepSeek API**: AI服务接口，用于生成自定义问题的答案
- **OpenID**: 微信用户唯一标识符，用于关联用户数据

## Requirements

### Requirement 1

**User Story:** 作为用户，我想要从知识库页面收藏问题和答案，以便后续快速查看重要内容。

#### Acceptance Criteria

1. WHEN a user views a knowledge question detail page THEN the system SHALL display a favorite button with clear visual state (favorited/unfavorited)
2. WHEN a user clicks the favorite button on a knowledge question THEN the system SHALL save the question text, answer content, source type as "knowledge", and category tag to the favorites database
3. WHEN a user favorites a knowledge question THEN the system SHALL provide immediate visual feedback and update the button state
4. WHEN a user clicks the favorite button on an already favorited question THEN the system SHALL remove the item from favorites and update the button state
5. WHEN saving a knowledge question THEN the system SHALL associate it with the user's OpenID for data isolation

### Requirement 2

**User Story:** 作为用户，我想要从简历解读页面收藏问答对话，以便保存有价值的分析结果。

#### Acceptance Criteria

1. WHEN a user views a resume analysis conversation THEN the system SHALL display a favorite button for each question-answer pair
2. WHEN a user favorites a resume conversation THEN the system SHALL save the question text, AI-generated answer, source type as "resume", and timestamp
3. WHEN saving a resume conversation THEN the system SHALL preserve the complete Markdown formatted answer content
4. WHEN a user favorites a resume conversation THEN the system SHALL automatically tag it with "简历分析" label
5. WHEN the favorite operation completes THEN the system SHALL show a success toast message

### Requirement 3

**User Story:** 作为用户，我想要在收藏页面自定义添加问题并获取AI答案，以便扩展我的面试准备内容。

#### Acceptance Criteria

1. WHEN a user opens the favorites page THEN the system SHALL display an "Add Question" button prominently
2. WHEN a user clicks "Add Question" THEN the system SHALL present a modal with a text input field for entering the question
3. WHEN a user submits a custom question THEN the system SHALL validate the question is not empty and has a minimum length of 5 characters
4. WHEN a valid custom question is submitted THEN the system SHALL call the DeepSeek API to generate an answer
5. WHEN the AI generates an answer THEN the system SHALL save the question-answer pair with source type as "custom" and allow the user to add tags

### Requirement 4

**User Story:** 作为用户，我想要在AI生成答案时看到流式输出，以便不必等待完整答案生成完毕。

#### Acceptance Criteria

1. WHEN the system calls the DeepSeek API for answer generation THEN the system SHALL use streaming mode to receive response chunks
2. WHEN receiving answer chunks THEN the system SHALL incrementally update the displayed answer content in real-time
3. WHEN streaming is in progress THEN the system SHALL display a loading indicator showing generation status
4. WHEN streaming completes successfully THEN the system SHALL save the complete answer to the database and hide the loading indicator
5. WHEN streaming encounters an error THEN the system SHALL display an error message and allow the user to retry

### Requirement 5

**User Story:** 作为用户，我想要查看我的所有收藏问题列表，以便快速浏览和访问已保存的内容。

#### Acceptance Criteria

1. WHEN a user opens the favorites page THEN the system SHALL display all favorited questions in reverse chronological order (newest first)
2. WHEN displaying the favorites list THEN the system SHALL show question text preview (first 50 characters), tags, source type icon, and creation time for each item
3. WHEN the favorites list is empty THEN the system SHALL display an empty state with a prompt to add questions
4. WHEN a user scrolls to the bottom of the list THEN the system SHALL load more items using pagination (20 items per page)
5. WHEN loading favorites THEN the system SHALL filter items by the current user's OpenID

### Requirement 6

**User Story:** 作为用户，我想要点击收藏问题查看完整答案，以便深入学习内容。

#### Acceptance Criteria

1. WHEN a user clicks a favorite item in the list THEN the system SHALL navigate to a detail page showing the complete question and answer
2. WHEN displaying the answer THEN the system SHALL use the towxml component to render Markdown content with proper formatting
3. WHEN the detail page loads THEN the system SHALL display the question text, formatted answer, tags, source type, and creation time
4. WHEN the answer contains code blocks THEN the system SHALL apply syntax highlighting through towxml
5. WHEN the user views the detail page THEN the system SHALL provide options to edit tags, delete the item, or share the content

### Requirement 7

**User Story:** 作为用户，我想要为收藏的问题添加和管理标签，以便更好地组织和分类内容。

#### Acceptance Criteria

1. WHEN a user views a favorite item THEN the system SHALL display all associated tags as colored badges
2. WHEN a user adds a new tag THEN the system SHALL validate the tag name is not empty and has a maximum length of 10 characters
3. WHEN a user adds a tag THEN the system SHALL save the tag association to the database and update the UI immediately
4. WHEN a user removes a tag THEN the system SHALL delete the tag association and update the display
5. WHEN displaying tags THEN the system SHALL show a maximum of 5 tags per question, with an indicator if more exist

### Requirement 8

**User Story:** 作为用户，我想要按标签筛选收藏问题，以便快速找到特定类别的内容。

#### Acceptance Criteria

1. WHEN a user opens the favorites page THEN the system SHALL display a tag filter section showing all available tags with question counts
2. WHEN a user selects a tag filter THEN the system SHALL display only questions associated with that tag
3. WHEN a tag filter is active THEN the system SHALL highlight the selected tag and show a clear filter indicator
4. WHEN a user clears the tag filter THEN the system SHALL display all favorited questions again
5. WHEN no questions match the selected tag THEN the system SHALL display an appropriate empty state message

### Requirement 9

**User Story:** 作为用户，我想要删除不需要的收藏问题，以便保持列表整洁。

#### Acceptance Criteria

1. WHEN a user views a favorite item THEN the system SHALL provide a delete action (swipe-to-delete or delete button)
2. WHEN a user initiates delete THEN the system SHALL show a confirmation dialog to prevent accidental deletion
3. WHEN a user confirms deletion THEN the system SHALL remove the item from the database and update the UI
4. WHEN deletion completes THEN the system SHALL show a success message with an undo option (5 seconds)
5. WHEN a user clicks undo THEN the system SHALL restore the deleted item to the favorites list

### Requirement 10

**User Story:** 作为用户，我想要编辑自定义问题的内容，以便修正错误或优化表达。

#### Acceptance Criteria

1. WHEN a user views a custom question detail THEN the system SHALL display an edit button
2. WHEN a user clicks edit THEN the system SHALL show an editable text field with the current question text
3. WHEN a user modifies the question text THEN the system SHALL validate the new text meets minimum length requirements
4. WHEN a user saves the edited question THEN the system SHALL update the database and refresh the display
5. WHEN a user edits a question THEN the system SHALL preserve the original answer and tags unless explicitly changed

### Requirement 11

**User Story:** 作为开发者，我想要后端API支持收藏功能的所有操作，以便前端能够可靠地管理用户数据。

#### Acceptance Criteria

1. WHEN the backend receives a create favorite request THEN the system SHALL validate all required fields (openid, question, answer, source_type) are present
2. WHEN storing a favorite THEN the system SHALL save the data to a MySQL database table with proper indexing on openid and created_at
3. WHEN the backend receives a list favorites request THEN the system SHALL return paginated results filtered by openid with tag information
4. WHEN the backend receives an update request THEN the system SHALL validate the user owns the favorite item before allowing modifications
5. WHEN the backend receives a delete request THEN the system SHALL perform a soft delete or hard delete based on configuration and return success status

### Requirement 12

**User Story:** 作为开发者，我想要实现流式AI答案生成的后端接口，以便提供良好的用户体验。

#### Acceptance Criteria

1. WHEN the backend receives a generate answer request THEN the system SHALL call the DeepSeek API with streaming enabled
2. WHEN receiving streaming chunks from DeepSeek THEN the system SHALL forward the chunks to the client using Server-Sent Events (SSE) or WebSocket
3. WHEN streaming is in progress THEN the system SHALL handle connection interruptions gracefully and allow reconnection
4. WHEN streaming completes THEN the system SHALL send a completion signal to the client
5. WHEN an error occurs during streaming THEN the system SHALL send an error event with a descriptive message and error code

### Requirement 13

**User Story:** 作为用户，我想要收藏功能在会员和非会员状态下都能使用，但有合理的限制。

#### Acceptance Criteria

1. WHEN a non-member user accesses favorites THEN the system SHALL allow viewing and managing up to 10 favorited items
2. WHEN a non-member user attempts to add the 11th favorite THEN the system SHALL display a prompt to upgrade to membership
3. WHEN a member user accesses favorites THEN the system SHALL allow unlimited favorited items
4. WHEN checking favorite limits THEN the system SHALL query the member status from the existing member API
5. WHEN a user upgrades to membership THEN the system SHALL immediately unlock the favorite limit without requiring app restart

### Requirement 14

**User Story:** 作为用户，我想要收藏的答案内容正确渲染Markdown格式，以便阅读体验良好。

#### Acceptance Criteria

1. WHEN displaying an answer THEN the system SHALL use the towxml component to parse and render Markdown syntax
2. WHEN the answer contains headings THEN the system SHALL render them with appropriate font sizes and weights
3. WHEN the answer contains code blocks THEN the system SHALL display them with monospace font and background highlighting
4. WHEN the answer contains lists THEN the system SHALL render them with proper indentation and bullet points
5. WHEN the answer contains links THEN the system SHALL make them clickable and open in a web view or external browser
