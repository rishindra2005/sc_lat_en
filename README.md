# TipTap to LaTeX: Professional Academic Editor

A sophisticated web application designed to bridge the gap between rich-text editing and professional LaTeX typesetting. This tool provides a seamless workflow for researchers and academics, allowing them to edit in a user-friendly environment while generating high-quality, journal-ready PDF documents in real-time.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/framework-Next.js%2015-black)
![TipTap](https://img.shields.io/badge/editor-TipTap-green)

## 🚀 Features

### 1. Interactive 3-Column Interface
*   **Column 1: TipTap Editor** – A fully interactive WYSIWYG editor with custom React NodeViews for complex document structures.
*   **Column 2: LaTeX Source** – Live-view of the generated LaTeX code, featuring smart escaping and automatic formatting.
*   **Column 3: PDF Preview** – A real-time, compiled PDF preview powered by a backend LaTeX engine.

### 2. State-of-the-Art Parsing Engine
Our custom AST-to-LaTeX parser handles:
*   **Smart Heading Detection:** Automatically converts markdown symbols (`#`, `##`) and numbered lines into LaTeX sections, while stripping redundant manual numbering.
*   **Academic Frontmatter:** Custom `entitySection` node for managing Titles, Authors, and Institutional affiliations.
*   **Dynamic Tables:** Utilizes `tabularx` and `booktabs` for auto-sizing, professional-grade tables that prevent margin overflow.
*   **Two-Column Support:** Uses `table*` environments to ensure tables span correctly across dual-column layouts like IEEE.
*   **Semantic Detection:** Automatically identifies and wraps Abstracts, Conclusions, and References in appropriate LaTeX environments.

### 3. Professional Templates
Choose from four built-in academic styles:
*   **Standard Article:** Clean, single-column document.
*   **IEEE / Two-Column:** Standard journal format for engineering and tech papers.
*   **APA:** Follows the American Psychological Association (7th ed.) style guides.
*   **Modern / Custom:** A stylized template with custom fonts and Indigo-themed headers.

## 🛠️ Technical Stack

*   **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS.
*   **Editor:** TipTap (ProseMirror-based) with custom extensions.
*   **Compiler:** Node.js backend wrapping `pdflatex`.
*   **Icons:** Lucide React.

## 📦 Installation & Setup

### Prerequisites
*   Node.js (v18+)
*   A TeX distribution installed (e.g., TeX Live or MiKTeX) with `pdflatex` available in your system PATH.

### Steps
1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd sc_lat_en
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the development server:**
    ```bash
    npm run dev
    ```

4.  **Access the app:**
    Navigate to `http://localhost:3000`.

## 📖 Usage Guide

1.  **Upload Content:** Click the **Upload JSON** button to seed the editor. You can find sample document structures in the `/jsons` directory of this project.
2.  **Select Template:** Use the dropdown in the navbar to switch between the 4 available academic styles.
3.  **Edit Content:** Use the TipTap editor to modify your text. Note how the LaTeX source updates instantly.
4.  **Smart Headings:** You can type `## 2.1. Results` and the parser will automatically generate `\subsection{Results}`.
5.  **Tables:** Insert tables normally; the parser handles the complexity of `tabularx` and `booktabs` automatically to ensure they fit the page.

## 🧪 Development & Testing
To verify the parser's logic independently:
```bash
node scripts/test-parser.js
```

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
