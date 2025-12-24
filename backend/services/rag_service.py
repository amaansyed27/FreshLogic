
import os
import pickle
import numpy as np
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Load env from backend root if needed
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

class FreshLogicRAGService:
    def __init__(self):
        self.api_key = os.environ.get("GEMINI_API_KEY")
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)
        else:
            print("Warning: GEMINI_API_KEY not found. RAG queries will fail.")
            self.client = None

        self.knowledge_base_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "data",
            "knowledge_base.pkl"
        )
        self.kb_data = None
        self._load_knowledge_base()

    def _load_knowledge_base(self):
        """Loads vectors and metadata from the pickle file."""
        if not os.path.exists(self.knowledge_base_path):
            print(f"Knowledge Base not found at {self.knowledge_base_path}")
            return

        try:
            with open(self.knowledge_base_path, "rb") as f:
                self.kb_data = pickle.load(f)
            print(f"Loaded Knowledge Base: {len(self.kb_data['documents'])} items.")
        except Exception as e:
            print(f"Error loading knowledge base: {e}")

    def get_embedding(self, text):
        """Generates embedding for a query."""
        if not self.client:
            return None
        try:
            response = self.client.models.embed_content(
                model="models/text-embedding-004",
                contents=text,
            )
            return np.array(response.embeddings[0].values)
        except Exception as e:
            print(f"Error embedding query: {e}")
            return None

    def query_knowledge_base(self, query: str, n_results: int = 3) -> list:
        """
        Finds the most relevant documents for the query using cosine similarity.
        Returns a list of dictionaries with 'document', 'metadata', and 'score'.
        """
        if not self.kb_data:
            print("Knowledge base not loaded.")
            return []

        query_emb = self.get_embedding(query)
        if query_emb is None:
            return []

        # Calculate cosine similarity
        # Similarity = (A . B) / (||A|| * ||B||)
        # Since embeddings from generic-ai are likely normalized, dot product might suffice, 
        # but let's be safe.
        
        doc_embs = self.kb_data["embeddings"]
        
        # Norms
        norm_query = np.linalg.norm(query_emb)
        norm_docs = np.linalg.norm(doc_embs, axis=1)
        
        # Dot product
        dot_products = np.dot(doc_embs, query_emb)
        
        # Cosine similarity
        similarities = dot_products / (norm_docs * norm_query)
        
        # Get top N indices
        top_indices = np.argsort(similarities)[::-1][:n_results]
        
        results = []
        for idx in top_indices:
            results.append({
                "document": self.kb_data["documents"][idx],
                "metadata": self.kb_data["metadatas"][idx],
                "score": float(similarities[idx])
            })
            
        return results

# Singleton instance
rag_service = FreshLogicRAGService()
