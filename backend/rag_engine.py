import os
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import Chroma
from langchain_core.prompts.prompt import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_core.documents import Document
from dotenv import load_dotenv

# OCR imports
try:
    from pdf2image import convert_from_path
    import pytesseract
    OCR_AVAILABLE = True
    
    # Set Tesseract path for Windows
    tesseract_paths = [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
    ]
    for tess_path in tesseract_paths:
        if os.path.exists(tess_path):
            pytesseract.pytesseract.tesseract_cmd = tess_path
            break
except ImportError:
    OCR_AVAILABLE = False
    print("Warning: OCR libraries not installed. Scanned PDFs won't be supported.")

load_dotenv()

class RAGEngine:
    def __init__(self):
        self.vector_store = None
        self.retriever = None
        self.chain = None
        self.api_key = os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY not found in environment variables. Please create a .env file with your API key.")

    def _extract_text_with_ocr(self, file_path: str):
        """Extract text from scanned PDF using OCR."""
        if not OCR_AVAILABLE:
            raise ValueError("OCR libraries not installed. Please install pdf2image and pytesseract.")
        
        print("PDF appears to be scanned. Using OCR to extract text...")
        print("This may take a few minutes for large documents.")
        
        # Convert PDF pages to images
        # Try to find Poppler in common locations
        poppler_path = None
        possible_paths = [
            os.path.join(os.environ.get('LOCALAPPDATA', ''), 'poppler', 'poppler-24.08.0', 'Library', 'bin'),
            os.path.join(os.environ.get('PROGRAMFILES', ''), 'poppler', 'bin'),
            r"C:\Program Files\poppler\bin",
        ]
        for path in possible_paths:
            if os.path.exists(path):
                poppler_path = path
                break
        
        try:
            if poppler_path:
                print(f"Using Poppler from: {poppler_path}")
                images = convert_from_path(file_path, poppler_path=poppler_path)
            else:
                images = convert_from_path(file_path)
        except Exception as e:
            raise ValueError(f"Failed to convert PDF to images. Make sure Poppler is installed. Error: {e}")
        
        docs = []
        for i, image in enumerate(images):
            print(f"Processing page {i + 1}/{len(images)} with OCR...")
            text = pytesseract.image_to_string(image)
            if text.strip():
                docs.append(Document(
                    page_content=text,
                    metadata={"page": i, "source": file_path}
                ))
        
        return docs

    def process_pdf(self, file_path: str):
        """Loads a PDF, splits it, and creates a vector store."""
        print(f"Processing PDF: {file_path}")
        
        # First try normal text extraction
        loader = PyPDFLoader(file_path)
        docs = loader.load()
        
        print(f"Loaded {len(docs)} pages from PDF")
        
        # Check if we got any actual text content
        total_text = "".join(doc.page_content for doc in docs).strip()
        
        if not total_text or len(total_text) < 100:
            # PDF is likely scanned, try OCR
            print(f"Only found {len(total_text)} characters. PDF may be scanned.")
            docs = self._extract_text_with_ocr(file_path)
            print(f"OCR extracted text from {len(docs)} pages")
        
        if not docs:
            raise ValueError("No content could be extracted from the PDF.")

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            add_start_index=True
        )
        splits = text_splitter.split_documents(docs)
        
        # Filter out empty chunks
        splits = [doc for doc in splits if doc.page_content and doc.page_content.strip()]
        
        print(f"Created {len(splits)} text chunks after splitting")
        
        if not splits:
            raise ValueError("No valid text content found in the PDF after splitting.")

        # Initialize Embeddings
        embeddings = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001",
            google_api_key=self.api_key
        )

        # Create Vector Store
        self.vector_store = Chroma.from_documents(
            documents=splits, 
            embedding=embeddings,
            persist_directory="./chroma_db" # Persist to disk
        )
        self.retriever = self.vector_store.as_retriever(search_type="similarity", search_kwargs={"k": 5})
        self._setup_chain()
        print("PDF processed and index created.")
        return len(docs)

    def _setup_chain(self):
        """Sets up the RAG chain with the specific persona."""
        llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.3)

        template = """You are an expert AI Book Agent. The user has uploaded a book, and your job is to answer questions based ONLY on the following context from that book.

        Context:
        {context}

        Question: {question}

        Rules:
        1. Answer in a clear, friendly, conversational style (like a helpful tutor).
        2. Keep answers concise unless asked for details.
        3. If the context mentions a figure, table, or diagram, briefly describe it first if relevant.
        4. Do NOT use outside knowledge. If the answer is not in the context, say "Based on the uploaded book, I cannot find the answer to that."
        5. Never break character.

        Answer:"""
        
        prompt = PromptTemplate.from_template(template)

        def format_docs(docs):
            return "\n\n".join(doc.page_content for doc in docs)

        self.chain = (
            {"context": self.retriever | format_docs, "question": RunnablePassthrough()}
            | prompt
            | llm
            | StrOutputParser()
        )

    def query(self, question: str):
        """Queries the RAG chain."""
        if not self.chain:
            return "Please upload a PDF first so I can learn the content."
        
        return self.chain.invoke(question)
