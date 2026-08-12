import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

export async function enriquecerDadosEmpresa(cnpj: string, razaoSocial: string) {
  if (!API_KEY) {
    console.warn("Chave da API do Gemini não configurada.");
    return null;
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Atue como um assistente de extração de dados públicos B2B do Brasil.
      Encontre informações públicas para a seguinte empresa:
      CNPJ: ${cnpj}
      Razão Social: ${razaoSocial}
      
      Retorne APENAS um JSON válido, sem markdown e sem formatação extra, com a seguinte estrutura estrita:
      {
        "telefone": "telefone de contato (ex: 11999999999) contendo apenas números, ou null se não achar",
        "email": "email de contato comercial, ou null se não achar",
        "segmento": "escolha UMA opção exata desta lista: 'Mercado', 'Exportação' ou 'Ambos'. (Se não tiver certeza, sugira 'Mercado')",
        "observacoes": "um parágrafo curto (max 2 linhas) de resumo sobre o que a empresa faz (atividades/produtos)."
      }
      
      Se você não encontrar nada sobre a empresa na sua base de conhecimento, tente adivinhar o segmento pela Razão Social e gere um resumo hipotético, mas deixe telefone e email como null.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Limpar crase do markdown caso o modelo retorne
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "");
    
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Erro ao enriquecer dados com IA:", error);
    return null;
  }
}

export async function buscarEmpresasPorNome(nome: string) {
  if (!API_KEY) {
    console.warn("Chave da API do Gemini não configurada.");
    return [];
  }

  try {
    // Usando o gemini-1.5-flash, que é o modelo padrão estável e gratuito para a maioria das API Keys.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Atue como um especialista em dados B2B de empresas brasileiras.
      O usuário buscou pela empresa: "${nome}"
      
      Por favor, encontre as empresas mais prováveis que correspondem a essa busca na sua base de conhecimento.
      Tente adivinhar as filiais principais ou a matriz da empresa.
      
      Retorne APENAS um array JSON válido, sem markdown, contendo de 1 a 5 objetos com esta exata estrutura:
      [
        {
          "nome": "Razão Social Completa ou Nome Fantasia",
          "cidade": "Cidade - UF (ex: São Paulo - SP)",
          "cnpj": "CNPJ com apenas números (14 dígitos exatos, sem pontuação)"
        }
      ]
      
      Seja o mais preciso possível. Não retorne nenhum outro texto além do JSON array.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Limpar crase do markdown caso o modelo retorne
    let cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    // As vezes a busca no Google traz um texto explicativo antes ou depois. Vamos tentar isolar o array JSON
    const startIndex = cleanJson.indexOf('[');
    const endIndex = cleanJson.lastIndexOf(']');
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      cleanJson = cleanJson.substring(startIndex, endIndex + 1);
    }
    
    const parsed = JSON.parse(cleanJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Erro ao buscar empresas por nome com IA:", error);
    return [];
  }
}
