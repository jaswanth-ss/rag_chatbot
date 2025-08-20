import { Component, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements AfterViewChecked {
  @ViewChild('chatMessages') chatMessagesContainer!: ElementRef;
  
  title = 'RAG Chat Application';
  uploadedFile: File | null = null;
  isDragOver = false;
  isUploading = false;
  textContent = '';
  isProcessingText = false;
  chatHistory: any[] = [];
  currentMessage = '';
  isLoadingResponse = false;
  documentStatus: any = null;
  hasContent = false;
  apiUrl = 'http://localhost:3000/api';
  shouldScrollToBottom = false;

  constructor(private http: HttpClient) {}

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  scrollToBottom(): void {
    try {
      this.chatMessagesContainer.nativeElement.scrollTop = 
        this.chatMessagesContainer.nativeElement.scrollHeight;
    } catch(err) {}
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileSelection(files[0]);
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.handleFileSelection(file);
    }
  }

  handleFileSelection(file: File): void {
    if (file.type === 'application/pdf') {
      this.uploadedFile = file;
      this.documentStatus = null;
    } else {
      this.documentStatus = {
        type: 'error',
        message: 'Please select a PDF file'
      };
    }
  }

  uploadFile(): void {
    if (!this.uploadedFile) return;

    this.isUploading = true;
    const formData = new FormData();
    formData.append('pdf', this.uploadedFile);

    this.http.post(`${this.apiUrl}/upload-pdf`, formData).subscribe({
      next: (response: any) => {
        this.documentStatus = {
          type: 'success',
          message: `PDF processed successfully! ${response.pages} pages indexed.`
        };
        this.hasContent = true;
        this.isUploading = false;
      },
      error: (error) => {
        this.documentStatus = {
          type: 'error',
          message: 'Error processing PDF: ' + (error.error?.error || 'Unknown error')
        };
        this.isUploading = false;
      }
    });
  }

  processText(): void {
    if (!this.textContent.trim()) return;

    this.isProcessingText = true;
    
    this.http.post(`${this.apiUrl}/process-text`, { text: this.textContent }).subscribe({
      next: (response: any) => {
        this.documentStatus = {
          type: 'success',
          message: `Text processed successfully! ${response.length} characters indexed.`
        };
        this.hasContent = true;
        this.isProcessingText = false;
      },
      error: (error) => {
        this.documentStatus = {
          type: 'error',
          message: 'Error processing text: ' + (error.error?.error || 'Unknown error')
        };
        this.isProcessingText = false;
      }
    });
  }

  onEnterPressed(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  sendMessage(): void {
    if (!this.currentMessage.trim() || !this.hasContent || this.isLoadingResponse) {
      return;
    }

    const userMessage = {
      type: 'user',
      content: this.currentMessage,
      timestamp: new Date()
    };
    this.chatHistory.push(userMessage);
    this.shouldScrollToBottom = true;

    const messageToSend = this.currentMessage;
    this.currentMessage = '';
    this.isLoadingResponse = true;

    this.http.post(`${this.apiUrl}/chat`, { message: messageToSend }).subscribe({
      next: (response: any) => {
        const aiMessage = {
          type: 'ai',
          content: response.response,
          timestamp: new Date()
        };
        this.chatHistory.push(aiMessage);
        this.isLoadingResponse = false;
        this.shouldScrollToBottom = true;
      },
      error: (error) => {
        const errorMessage = {
          type: 'ai',
          content: 'Sorry, there was an error: ' + (error.error?.error || 'Unknown error'),
          timestamp: new Date()
        };
        this.chatHistory.push(errorMessage);
        this.isLoadingResponse = false;
        this.shouldScrollToBottom = true;
      }
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}